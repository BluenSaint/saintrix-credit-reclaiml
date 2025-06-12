import { LegalCoach } from '@/components/LegalCoach';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function LegalCoachPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Legal Coach</h1>
          <p className="text-muted-foreground">
            Get answers to your questions about credit rights and the Fair Credit Reporting Act (FCRA)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LegalCoach />
          </div>
          <div>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Common Questions</h2>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">What is the Fair Credit Reporting Act (FCRA)?</h3>
                      <p className="text-sm text-muted-foreground">
                        The FCRA is a federal law that regulates how consumer reporting agencies collect, use, and share your credit information.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">How long can negative information stay on my credit report?</h3>
                      <p className="text-sm text-muted-foreground">
                        Most negative information can stay for 7 years. Bankruptcies can stay for 7-10 years, depending on the type.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">What rights do I have under the FCRA?</h3>
                      <p className="text-sm text-muted-foreground">
                        You have the right to access your credit reports, dispute inaccurate information, and control who can access your credit data.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">How do I dispute errors on my credit report?</h3>
                      <p className="text-sm text-muted-foreground">
                        You can dispute errors by writing to the credit bureau and information provider, including supporting documents.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">Can I get my credit report for free?</h3>
                      <p className="text-sm text-muted-foreground">
                        Yes, you can get a free copy of your credit report from each major credit bureau once every 12 months.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">What is a credit score?</h3>
                      <p className="text-sm text-muted-foreground">
                        A credit score is a number that represents your creditworthiness based on your credit history and other factors.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">How can I improve my credit score?</h3>
                      <p className="text-sm text-muted-foreground">
                        Pay bills on time, keep credit card balances low, and avoid opening too many new accounts at once.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">What is a credit freeze?</h3>
                      <p className="text-sm text-muted-foreground">
                        A credit freeze restricts access to your credit report, making it harder for identity thieves to open new accounts in your name.
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 