"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface Report {
  id: number;
  gig_title: string;
  seller: string;
  report_reason: string;
  reported_by: string;
  report_date: string;
  status: string;
}

export default function ManageReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  useEffect(() => {
    // Fetch reports from API
    fetch("http://localhost:8800/api/reports")
      .then(res => res.json())
      .then(data => setReports(Array.isArray(data.reports) ? data.reports : []));
  }, []);

  return (
    <div className="container px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Report Management</h1>
        <p className="text-muted-foreground">View and manage all reported gigs/services</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>List of all reported gigs/services</CardDescription>
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
                <TableHead>Status</TableHead>
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
                  <TableCell>
                    <Badge variant={report.status === "pending" ? "secondary" : report.status === "resolved" ? "default" : "outline"}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">No reports found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 