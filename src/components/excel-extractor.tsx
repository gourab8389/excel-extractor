'use client'

import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { processExcelFile, ExcelResponse } from '@/app/actions/excel-actions';

export default function ExcelExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExcelResponse | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) return;

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await processExcelFile(formData);
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        sheets: [],
        totalSheets: 0,
        fileName: file.name,
        error: 'An unexpected error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = () => {
    if (!result) return;
    
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.fileName.replace(/\.[^/.]+$/, '')}_extracted.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <p className="text-muted-foreground">
          Upload your Excel file and get JSON data instantly
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload Excel File
          </CardTitle>
          <CardDescription>
            Supports .xlsx, .xls, and .csv files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    {file && (
                      <p className="text-xs text-blue-600 font-medium">{file.name}</p>
                    )}
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!file || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Extract Data
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          {result.success ? (
            <>
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Successfully extracted data from <strong>{result.fileName}</strong> - 
                  Found {result.totalSheets} sheet(s) with {result.sheets.reduce((acc, s) => acc + s.rowCount, 0)} total rows
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 justify-end">
                <Button onClick={downloadJson} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download JSON
                </Button>
                <Button onClick={copyToClipboard} variant="outline" size="sm">
                  Copy to Clipboard
                </Button>
                <Button
                  onClick={() => setShowRawJson(!showRawJson)}
                  variant="outline"
                  size="sm"
                >
                  {showRawJson ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Hide Raw JSON
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Show Raw JSON
                    </>
                  )}
                </Button>
              </div>

              {showRawJson && (
                <Card>
                  <CardHeader>
                    <CardTitle>Raw JSON Output</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              <Tabs defaultValue={result.sheets[0]?.sheetName || '0'}>
                <TabsList className="w-full justify-start overflow-x-auto">
                  {result.sheets.map((sheet, index) => (
                    <TabsTrigger key={index} value={sheet.sheetName}>
                      {sheet.sheetName}
                      <Badge variant="secondary" className="ml-2">
                        {sheet.rowCount}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {result.sheets.map((sheet, index) => (
                  <TabsContent key={index} value={sheet.sheetName}>
                    <Card>
                      <CardHeader>
                        <CardTitle>{sheet.sheetName}</CardTitle>
                        <CardDescription>
                          {sheet.rowCount} rows × {sheet.columnCount} columns
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <h3 className="text-sm font-semibold mb-2">Headers:</h3>
                          <div className="flex flex-wrap gap-2">
                            {sheet.headers.map((header, i) => (
                              <Badge key={i} variant="outline">
                                {header}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <div className="max-h-96 overflow-y-auto border rounded-lg">
                            <table className="w-full text-sm">
                              <thead className="bg-muted sticky top-0">
                                <tr>
                                  <th className="px-4 py-2 text-left font-medium">#</th>
                                  {sheet.headers.map((header, i) => (
                                    <th key={i} className="px-4 py-2 text-left font-medium">
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {sheet.data.map((row, rowIndex) => (
                                  <tr key={rowIndex} className="border-t hover:bg-muted/50">
                                    <td className="px-4 py-2 text-muted-foreground">
                                      {rowIndex + 1}
                                    </td>
                                    {sheet.headers.map((header, cellIndex) => (
                                      <td key={cellIndex} className="px-4 py-2">
                                        {String(row[header] ?? '')}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {result.error || 'An error occurred while processing the file'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}