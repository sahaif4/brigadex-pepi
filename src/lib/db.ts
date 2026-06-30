import { supabase } from './supabase';

export const db = {
  // Brigades
  brigades: {
    async getAll() {
      try {
        const { data, error } = await supabase
          .from('brigades')
          .select('*')
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('[v0] Error fetching brigades:', error);
        return [];
      }
    },

    async getById(id: string) {
      try {
        const { data, error } = await supabase
          .from('brigades')
          .select('*')
          .eq('id', id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
      } catch (error) {
        console.error('[v0] Error fetching brigade:', error);
        return null;
      }
    },

    async create(brigade: any) {
      try {
        const { data, error } = await supabase
          .from('brigades')
          .insert([brigade])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('[v0] Error creating brigade:', error);
        throw error;
      }
    },

    async update(id: string, updates: any) {
      try {
        const { data, error } = await supabase
          .from('brigades')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('[v0] Error updating brigade:', error);
        throw error;
      }
    },
  },

  // Alsintan (Equipment)
  alsintan: {
    async getByBrigade(brigadeId: string) {
      try {
        const { data, error } = await supabase
          .from('alsintan')
          .select('*')
          .eq('brigade_id', brigadeId)
          .eq('status', 'operational')
          .order('name');

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('[v0] Error fetching alsintan:', error);
        return [];
      }
    },

    async create(alsintan: any) {
      try {
        const { data, error } = await supabase
          .from('alsintan')
          .insert([alsintan])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('[v0] Error creating alsintan:', error);
        throw error;
      }
    },

    async update(id: string, updates: any) {
      try {
        const { data, error } = await supabase
          .from('alsintan')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('[v0] Error updating alsintan:', error);
        throw error;
      }
    },
  },

  // Daily Reports
  dailyReports: {
    async getByBrigadeAndDate(brigadeId: string, date: string) {
      try {
        const { data, error } = await supabase
          .from('daily_reports')
          .select(`
            *,
            brigade:brigades(*),
            alsintan(*),
            operator:operators(*),
            location:locations(*)
          `)
          .eq('brigade_id', brigadeId)
          .eq('report_date', date)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('[v0] Error fetching daily reports:', error);
        return [];
      }
    },

    async getByDateRange(brigadeId: string, startDate: string, endDate: string) {
      try {
        const { data, error } = await supabase
          .from('daily_reports')
          .select('*')
          .eq('brigade_id', brigadeId)
          .gte('report_date', startDate)
          .lte('report_date', endDate)
          .order('report_date', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('[v0] Error fetching date range reports:', error);
        return [];
      }
    },

    async create(report: any) {
      try {
        const { data, error } = await supabase
          .from('daily_reports')
          .insert([report])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('[v0] Error creating daily report:', error);
        throw error;
      }
    },

    async update(id: string, updates: any) {
      try {
        const { data, error } = await supabase
          .from('daily_reports')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('[v0] Error updating daily report:', error);
        throw error;
      }
    },
  },

  // Service Records
  serviceRecords: {
    async getByAlsintan(alsintanId: string) {
      try {
        const { data, error } = await supabase
          .from('service_records')
          .select('*')
          .eq('alsintan_id', alsintanId)
          .order('service_date', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('[v0] Error fetching service records:', error);
        return [];
      }
    },

    async create(record: any) {
      try {
        const { data, error } = await supabase
          .from('service_records')
          .insert([record])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('[v0] Error creating service record:', error);
        throw error;
      }
    },
  },

  // Damage Reports
  damageReports: {
    async getByAlsintan(alsintanId: string) {
      try {
        const { data, error } = await supabase
          .from('damage_reports')
          .select('*')
          .eq('alsintan_id', alsintanId)
          .order('report_date', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('[v0] Error fetching damage reports:', error);
        return [];
      }
    },

    async create(report: any) {
      try {
        const { data, error } = await supabase
          .from('damage_reports')
          .insert([report])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('[v0] Error creating damage report:', error);
        throw error;
      }
    },

    async updateStatus(id: string, status: string) {
      try {
        const { data, error } = await supabase
          .from('damage_reports')
          .update({ repair_status: status, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('[v0] Error updating damage report status:', error);
        throw error;
      }
    },
  },

  // Operators
  operators: {
    async getByBrigade(brigadeId: string) {
      try {
        const { data, error } = await supabase
          .from('operators')
          .select('*')
          .eq('brigade_id', brigadeId)
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('[v0] Error fetching operators:', error);
        return [];
      }
    },

    async create(operator: any) {
      try {
        const { data, error } = await supabase
          .from('operators')
          .insert([operator])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('[v0] Error creating operator:', error);
        throw error;
      }
    },
  },

  // Locations
  locations: {
    async getAll() {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .order('name');

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('[v0] Error fetching locations:', error);
        return [];
      }
    },

    async create(location: any) {
      try {
        const { data, error } = await supabase
          .from('locations')
          .insert([location])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('[v0] Error creating location:', error);
        throw error;
      }
    },
  },

  // Summaries
  weeklySummaries: {
    async getByBrigadeAndWeek(brigadeId: string, weekStarting: string) {
      try {
        const { data, error } = await supabase
          .from('weekly_summaries')
          .select('*')
          .eq('brigade_id', brigadeId)
          .eq('week_starting', weekStarting)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
      } catch (error) {
        console.error('[v0] Error fetching weekly summary:', error);
        return null;
      }
    },
  },

  monthlySummaries: {
    async getByBrigadeAndMonth(brigadeId: string, monthYear: string) {
      try {
        const { data, error } = await supabase
          .from('monthly_summaries')
          .select('*')
          .eq('brigade_id', brigadeId)
          .eq('month_year', monthYear)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
      } catch (error) {
        console.error('[v0] Error fetching monthly summary:', error);
        return null;
      }
    },
  },

  // Audit Logs
  auditLogs: {
    async create(log: any) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .insert([log])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('[v0] Error creating audit log:', error);
        // Don't throw - audit logs should not break functionality
        return null;
      }
    },
  },

  // Real-time subscriptions
  subscribe(table: string, callback: (payload: any) => void) {
    try {
      return supabase
        .channel(`public:${table}:*`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          callback
        )
        .subscribe();
    } catch (error) {
      console.error('[v0] Error subscribing to realtime changes:', error);
      return null;
    }
  },
};
