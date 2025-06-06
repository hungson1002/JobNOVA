"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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

// Add Pagination component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const maxVisiblePages = 5;
  let visiblePages = pages;
  if (totalPages > maxVisiblePages) {
    const start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const end = Math.min(totalPages, start + maxVisiblePages - 1);
    visiblePages = pages.slice(start - 1, end);
  }
  return (
    <div className="flex flex-col gap-2 py-4 border-t bg-gray-50/50">
      <div className="flex justify-center">
        <span className="text-sm font-medium text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {visiblePages[0] > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              1
            </Button>
            {visiblePages[0] > 2 && (
              <span className="px-2 text-gray-500">...</span>
            )}
          </>
        )}
        {visiblePages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={`h-8 w-8 p-0 ${
              currentPage === page
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "hover:bg-gray-100"
            }`}
          >
            {page}
          </Button>
        ))}
        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className="px-2 text-gray-500">...</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              {totalPages}
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ManageReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const { getToken } = useAuth()
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { setCurrentPage(1); }, [reports]);
  const totalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const reportsToShow = reports.slice(startIdx, startIdx + PAGE_SIZE);

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const token = await getToken()
        const res = await fetch("http://localhost:8800/api/reports", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const data = await res.json()
        setReports(Array.isArray(data.reports) ? data.reports : [])
      } catch (err) {
        console.error("Failed to fetch reports:", err)
      } finally {
        setLoading(false);
      }
    }
    fetchReports()
  }, [getToken])

  return (
    <div className="container max-w-5xl mx-auto px-4 py-10">
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-emerald-700 tracking-tight mb-2">Report Management</h1>
          <p className="text-lg text-gray-500">View and manage all reported gigs/services</p>
        </div>
      </div>
      <Card className="rounded-2xl border-2 border-gray-100">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="animate-spin h-8 w-8 text-emerald-500 mr-2" />
              <span className="text-lg text-gray-500">Loading reports...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900">
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">ID</TableHead>
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Gig/Service</TableHead>
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Seller</TableHead>
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Reason</TableHead>
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Reporter</TableHead>
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Date</TableHead>
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportsToShow.length > 0 ? reportsToShow.map(report => (
                    <TableRow key={report.id} className="hover:bg-emerald-50 transition-all">
                      <TableCell className="py-3 px-6 text-base">{report.id}</TableCell>
                      <TableCell className="py-3 px-6">
                        {report.gig_title === 'N/A' ? (
                          <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-500 font-semibold">Deleted</span>
                        ) : report.gig_title}
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        {report.seller === 'Unknown' ? (
                          <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-500 font-semibold">Unknown</span>
                        ) : report.seller}
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700 font-semibold capitalize">
                          {report.report_reason}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-6">{report.reported_by}</TableCell>
                      <TableCell className="py-3 px-6">{new Date(report.report_date).toLocaleDateString()}</TableCell>
                      <TableCell className="py-3 px-6 text-right">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => { setSelectedReport(report); setShowDetail(true); }}
                          className="rounded-full border-emerald-200 hover:bg-emerald-100"
                          aria-label="View Details"
                        >
                          <Eye className="h-5 w-5 text-emerald-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-400 text-lg">
                        No reports found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-md rounded-2xl border-2 border-emerald-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-emerald-700">Report Detail</DialogTitle>
            <DialogDescription>
              {selectedReport ? "Detailed information about this report:" : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">ID:</span>
                <span>{selectedReport.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Gig/Service:</span>
                <span>
                  {selectedReport.gig_title === 'N/A' ? (
                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-500 font-semibold">Deleted</span>
                  ) : selectedReport.gig_title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Seller:</span>
                <span>
                  {selectedReport.seller === 'Unknown' ? (
                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-500 font-semibold">Unknown</span>
                  ) : selectedReport.seller}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Reason:</span>
                <span className="inline-block px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700 font-semibold capitalize">
                  {selectedReport.report_reason}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Reporter:</span>
                <span>{selectedReport.reported_by}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Date:</span>
                <span>{new Date(selectedReport.report_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Description:</span>
                <div className="whitespace-pre-line text-gray-700 bg-gray-50 rounded p-2 border border-gray-200 min-h-[32px] mt-1">
                  {selectedReport.description ? selectedReport.description : <span className="text-gray-400">N/A</span>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 