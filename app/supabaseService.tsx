import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwfllbptpdqoovbeizya.supabase.co'; // Replace with your actual Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3ZmxsYnB0cGRxb292YmVpenlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk3NTA2NzUsImV4cCI6MjAxNTMyNjY3NX0._fCp3gc4vEDj9k5jme3Jo_cSA3tPhzOPcodcH3Gb65w';
const supabase = createClient(supabaseUrl, supabaseKey);


export const insertAdData = async (concept: string, date: Date, adName: string) => {
  const { data, error } = await supabase
    .from('adnames') // Replace with your actual table name
    .insert([{ concept, date, adName }]);
  return { data, error };
};

export const getAdData = async () => {
  const { data, error } = await supabase
    .from('adnames') // Replace with your actual table name
    .select('*');
    if (error) {
      console.error("Error fetching data from Supabase:", error);
    } else {
      console.log("Data fetched successfully:", data);
    }
    return { data, error };
};

export { supabase };



