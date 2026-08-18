/* ==========================================================================
   Vercel Serverless Function: Statistics Canada Data Ingestion Cron
   ========================================================================== */

import { createClient } from "@supabase/supabase-javascript";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Verify execution authorization token from Vercel Cron header
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized cron trigger." });
  }

  try {
    // Fetch live CPI vector data from Statistics Canada NDM API
    const response = await fetch("https://www150.statcan.gc.ca/t1/wds/rest/getDataFromCubePid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ productId: 18100004 }])
    });

    const rawData = await response.json();

    const payload = {
      region: "Canada",
      reference_period: new Date().toISOString().slice(0, 7),
      source_name: "Statistics Canada CPI Vector (Product 18100004)",
      data: rawData[0] || {}
    };

    const { error } = await supabase.from("grocery_data").insert([payload]);
    if (error) throw error;

    return res.status(200).json({ success: true, timestamp: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
