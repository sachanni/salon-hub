import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import MemoryStore from "memorystore";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days
  const MemoryStoreSession = MemoryStore(session);
  const sessionStore = new MemoryStoreSession({
    checkPeriod: 86400000, // Prune expired entries every 24h
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Capture userType for post-auth redirect
    const userType = req.query.userType as string;
    if (userType === 'owner') {
      (req.session as any).postAuthRedirect = '/business/setup';
    } else {
      // For customer users, redirect to customer dashboard
      (req.session as any).postAuthRedirect = '/customer/dashboard';
    }

    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, async (err: any, user: any) => {
      if (err) {
        return res.redirect("/api/login");
      }
      if (!user) {
        return res.redirect("/api/login");
      }

      // Log the user in
      req.logIn(user, async (err) => {
        if (err) {
          return res.redirect("/api/login");
        }

        // Check session for post-auth redirect preference first
        const postAuthRedirect = (req.session as any)?.postAuthRedirect;
        if (postAuthRedirect) {
          // Clear the session redirect after use
          delete (req.session as any).postAuthRedirect;
          return res.redirect(postAuthRedirect);
        }

        // Production-ready: check if this is a business owner and redirect accordingly
        try {
          const claims = (req.user as any).claims;
          
          if (claims && claims.email) {
            // Use imported storage directly
            const { storage } = await import('./storage');
            let dbUser = await storage.getUserByEmail(claims.email);
            
            if (dbUser) {
              // Check if user has roles, if not assign based on email pattern or default to customer
              let roles = await storage.getUserRoles(dbUser.id);
              
              // If no roles exist, auto-assign based on business intent detection
              if (roles.length === 0) {
                // Default: check if this appears to be a business user based on context
                // For now, we'll make them customer by default and let them upgrade
                let role = await storage.getRoleByName('customer');
                if (!role) {
                  role = await storage.createRole({
                    name: 'customer',
                    description: 'Customer'
                  });
                }
                await storage.assignUserRole(dbUser.id, role.id);
                roles = [role];
              }
              
              const isOwner = roles.some((role: any) => role.name === 'owner');
              
              if (isOwner) {
                // Check if business owner has completed setup
                const orgMemberships = await storage.getUserOrganizations(dbUser.id);
                const hasCompletedSetup = orgMemberships && orgMemberships.length > 0;
                
                if (!hasCompletedSetup) {
                  console.log(`Business owner ${claims.email} needs setup, redirecting to /business/setup`);
                  return res.redirect("/business/setup");
                }
                
                // If setup is complete, redirect to business dashboard
                console.log(`Business owner ${claims.email} has completed setup, redirecting to business dashboard`);
                return res.redirect("/business/dashboard");
              } else {
                // Customer - redirect to customer dashboard
                const isCustomer = roles.some((role: any) => role.name === 'customer');
                if (isCustomer) {
                  console.log(`Customer ${claims.email} authenticated, redirecting to customer dashboard`);
                  return res.redirect("/customer/dashboard");
                }
              }
            }
          }
          
          // Default redirect - fallback to home for unknown roles
          res.redirect("/");
        } catch (error) {
          console.error("Error checking user role in callback:", error);
          res.redirect("/");
        }
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    // Populate user data with roles and organization memberships for authorization
    try {
      const userId = user.claims?.sub;
      if (userId) {
        const dbUser = await storage.getUserById(userId);
        if (dbUser) {
          const userRoles = await storage.getUserRoles(userId);
          const orgMemberships = await storage.getUserOrganizations(userId);
          
          // Enhance the req.user object with role and org data
          (req as any).user = {
            ...user,
            id: userId,
            email: user.claims?.email,
            roles: userRoles.map(role => role.name),
            orgMemberships
          };
        }
      }
    } catch (error) {
      console.error("Failed to populate user data:", error);
      // Continue even if we can't populate extra data
    }
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    
    // Populate user data after token refresh
    try {
      const userId = user.claims?.sub;
      if (userId) {
        const dbUser = await storage.getUserById(userId);
        if (dbUser) {
          const userRoles = await storage.getUserRoles(userId);
          const orgMemberships = await storage.getUserOrganizations(userId);
          
          // Enhance the req.user object with role and org data
          (req as any).user = {
            ...user,
            id: userId,
            email: user.claims?.email,
            roles: userRoles.map(role => role.name),
            orgMemberships
          };
        }
      }
    } catch (error) {
      console.error("Failed to populate user data after refresh:", error);
    }
    
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};