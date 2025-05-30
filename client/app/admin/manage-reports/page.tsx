"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useAuth } from "@clerk/nextjs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Report {
  id: number;
  gig_title: string;
  seller: string;
  report_reason: string;
  reported_by: string;
  report_date: string;
  status: string;
  description?: string;
}

export default function ManageReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const { getToken } = useAuth()
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  useEffect(() => {
    async function fetchReports() {
      try {
        const token = await getToken()
        const res = await fetch("http://localhost:8800/api/reports", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const data = await res.json()
        setReports(Array.isArray(data.reports) ? data.reports : [])
      } catch (err) {
        console.error("Lỗi fetch report:", err)
      }
    }

    fetchReports()
  }, [getToken])

  return (
    <div className="container px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Report Management</h1>
        <p className="text-muted-foreground">View and manage all reported gigs/services</p>
      </div>
      <Card>
        <CardHeader>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Gig/Service</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length > 0 ? reports.map(report => (
                <TableRow key={report.id}>
                  <TableCell>{report.id}</TableCell>
                  <TableCell>{report.gig_title}</TableCell>
                  <TableCell>{report.seller}</TableCell>
                  <TableCell>{report.report_reason}</TableCell>
                  <TableCell>{report.reported_by}</TableCell>
                  <TableCell>{new Date(report.report_date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedReport(report); setShowDetail(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No reports found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Detail</DialogTitle>
            <DialogDescription>
              {selectedReport ? "Detailed information about this report:" : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-2 mt-2">
              <div><b>ID:</b> {selectedReport.id}</div>
              <div><b>Gig/Service:</b> {selectedReport.gig_title}</div>
              <div><b>Seller:</b> {selectedReport.seller}</div>
              <div><b>Reason:</b> {selectedReport.report_reason}</div>
              <div><b>Reporter:</b> {selectedReport.reported_by}</div>
              <div><b>Date:</b> {new Date(selectedReport.report_date).toLocaleDateString()}</div>
              <div><b>Description:</b></div>
              <div className="whitespace-pre-line text-gray-700 bg-gray-50 rounded p-2 border border-gray-200 min-h-[32px]">
                {selectedReport.description ? selectedReport.description : <span className="text-gray-400">N/A</span>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 