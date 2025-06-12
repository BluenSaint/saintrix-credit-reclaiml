import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type CreditInsurance = Database['public']['Tables']['credit_insurance']['Row'];

export class CreditInsuranceService {
  static async addInsurance(data: Omit<CreditInsurance, 'id' | 'created_at' | 'updated_at'>): Promise<CreditInsurance> {
    const { data: insurance, error } = await supabase
      .from('credit_insurance')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return insurance;
  }

  static async getClientInsurance(clientId: string): Promise<CreditInsurance[]> {
    const { data, error } = await supabase
      .from('credit_insurance')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async updateInsurance(id: string, data: Partial<CreditInsurance>): Promise<CreditInsurance> {
    const { data: insurance, error } = await supabase
      .from('credit_insurance')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return insurance;
  }

  static async getInsuranceStatus(clientId: string): Promise<{
    activePolicies: number;
    totalCoverage: number;
    nextPaymentDue: Date | null;
    paymentStatus: string;
  }> {
    const { data, error } = await supabase
      .from('credit_insurance')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'active');

    if (error) throw error;

    const activePolicies = data.length;
    const totalCoverage = data.reduce((sum, policy) => sum + Number(policy.coverage_amount), 0);
    const nextPaymentDue = data.length > 0
      ? new Date(Math.min(...data.map(p => new Date(p.next_payment_date).getTime())))
      : null;
    const paymentStatus = data.some(p => p.payment_status === 'past_due')
      ? 'past_due'
      : data.every(p => p.payment_status === 'cancelled')
        ? 'cancelled'
        : 'current';

    return {
      activePolicies,
      totalCoverage,
      nextPaymentDue,
      paymentStatus
    };
  }

  static async recordPayment(id: string, paymentDate: Date): Promise<CreditInsurance> {
    const { data: insurance, error: fetchError } = await supabase
      .from('credit_insurance')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Calculate next payment date (1 month from payment date)
    const nextPaymentDate = new Date(paymentDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    const { data: updated, error: updateError } = await supabase
      .from('credit_insurance')
      .update({
        last_payment_date: paymentDate.toISOString(),
        next_payment_date: nextPaymentDate.toISOString(),
        payment_status: 'current'
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log the payment
    await supabase.from('admin_logs').insert({
      action: 'insurance_payment',
      details: {
        insurance_id: id,
        payment_date: paymentDate.toISOString(),
        next_payment_date: nextPaymentDate.toISOString()
      }
    });

    return updated;
  }

  static async checkExpiringPolicies(daysThreshold: number = 30): Promise<CreditInsurance[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const { data, error } = await supabase
      .from('credit_insurance')
      .select('*')
      .eq('status', 'active')
      .lte('end_date', thresholdDate.toISOString());

    if (error) throw error;
    return data;
  }

  static async getPaymentHistory(id: string): Promise<{
    payment_date: Date;
    amount: number;
    status: string;
  }[]> {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .eq('action', 'insurance_payment')
      .contains('details', { insurance_id: id })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(log => ({
      payment_date: new Date(log.details.payment_date),
      amount: log.details.amount || 0,
      status: log.details.status || 'completed'
    }));
  }
} 