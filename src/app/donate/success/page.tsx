// Donation Success Page
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, Heart, Ticket, Download, Share2 } from "lucide-react";

function DonationSuccessContent() {
  const searchParams = useSearchParams();
  const donationId = searchParams.get("donation_id");
  const [donationData, setDonationData] = useState<{
    donor_name: string;
    number_of_tickets: number;
    total_amount: number;
    donation_id: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDonationDetails = async () => {
      try {
        const response = await fetch(`/api/donate/details?donation_id=${donationId}`);
        const data = await response.json();
        
        if (data.success) {
          setDonationData(data.donation);
        }
      } catch (error) {
        console.error("Error fetching donation details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (donationId) {
      fetchDonationDetails();
    }
  }, [donationId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-6 animate-bounce">
            <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Thank You! 🎉
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Your donation has been received successfully
          </p>
        </div>

        {/* Donation Details Card */}
        <Card className="shadow-xl mb-6">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Heart className="h-6 w-6" />
              Donation Confirmation
            </CardTitle>
            <CardDescription className="text-green-50">
              {donationId && `Donation ID: ${donationId}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading donation details...</p>
              </div>
            ) : donationData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600 dark:text-gray-400">Donor Name</span>
                  <span className="font-semibold">{donationData.donor_name}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    Tickets Donated
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {donationData.number_of_tickets}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600 dark:text-gray-400">Total Amount</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{donationData.total_amount}
                  </span>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-6">
                  <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                    Your Impact
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Your generous donation of {donationData.number_of_tickets} {donationData.number_of_tickets === 1 ? "ticket" : "tickets"} will help {donationData.number_of_tickets === 1 ? "someone" : `${donationData.number_of_tickets} people`} who cannot afford to attend experience the transformative YESCA event. These tickets will be available at our front desk for eligible attendees.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Donation details not found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.print()}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Receipt
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: "I donated tickets to YESCA!",
                  text: `I just donated ${donationData?.number_of_tickets} tickets to help others attend YESCA events. Join me in making a difference!`,
                  url: window.location.origin + "/donate",
                });
              }
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Your Kindness
          </Button>
        </div>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold">Tickets Added to Pool</h4>
                <p className="text-sm text-muted-foreground">
                  Your donated tickets are now available in our system
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold">Front Desk Distribution</h4>
                <p className="text-sm text-muted-foreground">
                  Tickets will be issued at the front desk to eligible attendees
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold">Making a Difference</h4>
                <p className="text-sm text-muted-foreground">
                  You&apos;ll receive updates about how your donation helped others
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Return Home Button */}
        <div className="mt-8 text-center space-y-4">
          <Link href="/donate">
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <Heart className="mr-2 h-4 w-4" />
              Donate More Tickets
            </Button>
          </Link>
          <div>
            <Link href="/">
              <Button variant="ghost">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DonationSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      }
    >
      <DonationSuccessContent />
    </Suspense>
  );
}
