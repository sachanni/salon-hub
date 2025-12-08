import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  Phone,
  Mail,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

interface ImportPreviewData {
  fileName: string;
  headers: string[];
  detectedMapping: { nameColumn: string; phoneColumn: string; emailColumn?: string } | null;
  mapping: { nameColumn: string; phoneColumn: string; emailColumn?: string };
  preview: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    errors: Array<{ rowNumber: number; originalData: Record<string, string>; errors: string[] }>;
    preview: Array<{
      rowNumber: number;
      name: string;
      phone: string;
      normalizedPhone: string;
      email: string | null;
      isDuplicate: boolean;
      isValid: boolean;
    }>;
  };
  rowCount: number;
}

interface ImportedCustomer {
  id: string;
  customerName: string;
  phone: string;
  email: string | null;
  status: string;
  invitedAt: string | null;
  registeredAt: string | null;
  createdAt: string;
}

interface ImportBatch {
  id: string;
  fileName: string;
  totalRecords: number;
  successfulImports: number;
  failedImports: number;
  duplicateSkipped: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

interface ImportStats {
  totalImported: number;
  importedThisWeek: number;
  importedThisMonth: number;
  byStatus: {
    pending: number;
    invited: number;
    registered: number;
    expired: number;
  };
  conversionRate: string;
}

interface CustomerImportDashboardProps {
  salonId: string;
}

export default function CustomerImportDashboard({ salonId }: CustomerImportDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [columnMapping, setColumnMapping] = useState<{ nameColumn: string; phoneColumn: string; emailColumn?: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: stats, isLoading: statsLoading } = useQuery<ImportStats>({
    queryKey: ["/api/salons", salonId, "customers", "import", "stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/salons/${salonId}/customers/import/stats`);
      return response.json();
    },
  });

  const { data: batches, isLoading: batchesLoading } = useQuery<ImportBatch[]>({
    queryKey: ["/api/salons", salonId, "customers", "import", "batches"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/salons/${salonId}/customers/import/batches`);
      return response.json();
    },
  });

  const { data: customersData, isLoading: customersLoading, refetch: refetchCustomers } = useQuery<{
    customers: ImportedCustomer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: ["/api/salons", salonId, "customers", "imported", statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      const response = await apiRequest("GET", `/api/salons/${salonId}/customers/imported?${params.toString()}`);
      return response.json();
    },
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        toast({
          title: "Invalid File",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setPreviewData(null);
      setColumnMapping(null);
    }
  }, [toast]);

  const handlePreviewUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (columnMapping) {
        formData.append("mapping", JSON.stringify(columnMapping));
      }

      const response = await fetch(`/api/salons/${salonId}/customers/import/preview`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to preview import");
      }

      const data = await response.json();
      setPreviewData(data);
      if (data.detectedMapping) {
        setColumnMapping(data.detectedMapping);
      }
    } catch (error: any) {
      toast({
        title: "Preview Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile || !columnMapping) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("mapping", JSON.stringify(columnMapping));

      const response = await fetch(`/api/salons/${salonId}/customers/import`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import customers");
      }

      const result = await response.json();
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${result.successfulImports} customers. ${result.duplicateSkipped} duplicates skipped.`,
      });

      setSelectedFile(null);
      setPreviewData(null);
      setColumnMapping(null);
      setActiveTab("customers");
      
      queryClient.invalidateQueries({ queryKey: ["/api/salons", salonId, "customers"] });
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await apiRequest("DELETE", `/api/salons/${salonId}/customers/imported/${customerId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Customer Deleted" });
      refetchCustomers();
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "invited":
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Invited</Badge>;
      case "registered":
        return <Badge className="bg-green-500">Registered</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Import</h2>
          <p className="text-muted-foreground">
            Import existing customers from CSV files and invite them to your app
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Imported</p>
                <p className="text-2xl font-bold">{stats?.totalImported || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Invites</p>
                <p className="text-2xl font-bold">{stats?.byStatus?.pending || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registered</p>
                <p className="text-2xl font-bold">{stats?.byStatus?.registered || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{stats?.conversionRate || "0"}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload CSV
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Imported Customers
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Import History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Customer List</CardTitle>
              <CardDescription>
                Upload a CSV file containing your existing customers. Required columns: Name, Phone. Optional: Email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">
                    {selectedFile ? selectedFile.name : "Click to upload CSV file"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Maximum file size: 5MB, up to 10,000 rows
                  </p>
                </label>
              </div>

              {selectedFile && !previewData && (
                <Button onClick={handlePreviewUpload} disabled={isUploading} className="w-full">
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Import
                    </>
                  )}
                </Button>
              )}

              {previewData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Valid Rows</p>
                        <p className="text-xl font-bold text-green-700">{previewData.preview.validRows}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duplicates</p>
                        <p className="text-xl font-bold text-amber-700">{previewData.preview.duplicateRows}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Invalid Rows</p>
                        <p className="text-xl font-bold text-red-700">{previewData.preview.invalidRows}</p>
                      </div>
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Column Mapping</CardTitle>
                      <CardDescription>Verify or adjust the column mapping</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Name Column</Label>
                          <Select
                            value={columnMapping?.nameColumn}
                            onValueChange={(v) => setColumnMapping(prev => prev ? { ...prev, nameColumn: v } : { nameColumn: v, phoneColumn: "" })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {previewData.headers.map((h) => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Phone Column</Label>
                          <Select
                            value={columnMapping?.phoneColumn}
                            onValueChange={(v) => setColumnMapping(prev => prev ? { ...prev, phoneColumn: v } : { nameColumn: "", phoneColumn: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {previewData.headers.map((h) => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Email Column (Optional)</Label>
                          <Select
                            value={columnMapping?.emailColumn || "__none__"}
                            onValueChange={(v) => setColumnMapping(prev => prev ? { ...prev, emailColumn: v === "__none__" ? undefined : v } : null)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">None</SelectItem>
                              {previewData.headers.map((h) => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Preview (First 20 Rows)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.preview.preview.map((row) => (
                              <TableRow key={row.rowNumber} className={!row.isValid ? "bg-red-50" : row.isDuplicate ? "bg-amber-50" : ""}>
                                <TableCell>{row.rowNumber}</TableCell>
                                <TableCell>{row.name}</TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>{row.phone}</div>
                                    {row.normalizedPhone && (
                                      <div className="text-xs text-muted-foreground">{row.normalizedPhone}</div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{row.email || "-"}</TableCell>
                                <TableCell>
                                  {!row.isValid ? (
                                    <Badge variant="destructive">Invalid</Badge>
                                  ) : row.isDuplicate ? (
                                    <Badge variant="secondary">Duplicate</Badge>
                                  ) : (
                                    <Badge className="bg-green-500">Valid</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {previewData.preview.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {previewData.preview.errors.length} rows have errors and will be skipped during import.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewData(null);
                        setColumnMapping(null);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmImport}
                      disabled={isImporting || previewData.preview.validRows === 0}
                      className="flex-1"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Import {previewData.preview.validRows} Customers
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Imported Customers</CardTitle>
                  <CardDescription>
                    View and manage imported customers. Send invitations to bring them to your app.
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => refetchCustomers()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                    <SelectItem value="registered">Registered</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {customersLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : customersData?.customers?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No imported customers found</p>
                  <p className="text-sm">Upload a CSV file to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Imported</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customersData?.customers?.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.customerName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {customer.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.email ? (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {customer.email}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(customer.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(customer.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCustomerMutation.mutate(customer.id)}
                            disabled={deleteCustomerMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {customersData && customersData.totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {customersData.customers.length} of {customersData.total} customers
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>
                View past import operations and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {batchesLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : batches?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No import history</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Total Records</TableHead>
                      <TableHead>Imported</TableHead>
                      <TableHead>Duplicates</TableHead>
                      <TableHead>Failed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches?.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.fileName}</TableCell>
                        <TableCell>{batch.totalRecords}</TableCell>
                        <TableCell className="text-green-600">{batch.successfulImports}</TableCell>
                        <TableCell className="text-amber-600">{batch.duplicateSkipped}</TableCell>
                        <TableCell className="text-red-600">{batch.failedImports}</TableCell>
                        <TableCell>
                          {batch.status === "completed" ? (
                            <Badge className="bg-green-500">Completed</Badge>
                          ) : batch.status === "processing" ? (
                            <Badge variant="secondary">Processing</Badge>
                          ) : (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(batch.createdAt), "MMM d, yyyy HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
