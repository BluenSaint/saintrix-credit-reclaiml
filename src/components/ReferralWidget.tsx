import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Copy, Share, Gift } from "lucide-react";

interface ReferralStats {
  totalReferred: number;
  completedReferrals: number;
  freeMonthsEarned: number;
  referralCode: string;
  nextReward?: number;
}

interface ReferralWidgetProps {
  stats: ReferralStats;
  className?: string;
}

const ReferralWidget = ({ stats, className = "" }: ReferralWidgetProps) => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  
  const referralsNeeded = 3;
  const progressPercentage = (stats.completedReferrals % referralsNeeded) / referralsNeeded * 100;
  const referralsToNextReward = referralsNeeded - (stats.completedReferrals % referralsNeeded);

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(stats.referralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy referral code",
        variant: "destructive",
      });
    }
  };

  const shareReferralLink = async () => {
    setIsSharing(true);
    const referralLink = `https://saintrix.com/signup?ref=${stats.referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join SAINTRIX - Fix Your Credit',
          text: 'I\'ve been using SAINTRIX to improve my credit score. Join me and we both get rewards!',
          url: referralLink,
        });
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(referralLink);
        toast({
          title: "Link Copied!",
          description: "Referral link copied to clipboard",
        });
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Link Copied!",
        description: "Referral link copied to clipboard",
      });
    }
    setIsSharing(false);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Referral Program
        </CardTitle>
        <CardDescription>
          Invite friends and earn free months
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 border rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.totalReferred}</div>
            <div className="text-xs text-gray-500">Referred</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.completedReferrals}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
        </div>

        {/* Free Months Earned */}
        {stats.freeMonthsEarned > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-2">
              <Gift className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">
                You've earned {stats.freeMonthsEarned} free month{stats.freeMonthsEarned > 1 ? 's' : ''}!
              </span>
            </div>
          </div>
        )}

        {/* Progress to Next Reward */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to next free month</span>
            <span className="text-purple-600 font-medium">
              {referralsToNextReward} more needed
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-gray-600 text-center">
            Refer {referralsToNextReward} more paid user{referralsToNextReward > 1 ? 's' : ''} for a free month!
          </p>
        </div>

        {/* Referral Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Your Referral Code</label>
          <div className="flex space-x-2">
            <Input
              value={stats.referralCode}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={copyReferralCode}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Share Button */}
        <Button 
          onClick={shareReferralLink}
          disabled={isSharing}
          className="w-full btn-glossy text-white border-0"
        >
          <Share className="w-4 h-4 mr-2" />
          {isSharing ? "Sharing..." : "Share Referral Link"}
        </Button>

        {/* How it Works */}
        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-medium text-gray-900">How it works:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Share your referral code with friends</li>
            <li>• They sign up and become paying customers</li>
            <li>• For every 3 completed referrals, get 1 free month</li>
            <li>• No limit on free months you can earn!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralWidget;