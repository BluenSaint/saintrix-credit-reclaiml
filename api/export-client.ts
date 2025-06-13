import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

type Request = {
  method: string;
  body: {
    userId: string;
    format: 'pdf' | 'csv';
    adminId: string;
  };
};

type Response = {
  status: (code: number) => {
    json: (data: any) => void;
    send: (data: any) => void;
  };
  setHeader: (name: string, value: string) => void;
};

export default async function handler(req: Request, res: Response) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { userId, format, adminId } = req.body;
  if (!userId || !format || !adminId) return res.status(400).json({ error: "Missing parameters" });

  try {
    // Fetch all client data
    const { data: client } = await supabase.from("clients").select("*, user:auth.users(*), disputes(*), documents(*), letters(*), insurance_log(*)").eq("user_id", userId).single();
    if (!client) return res.status(404).json({ error: "Client not found" });

    let fileBuffer: Buffer;
    let fileName = `client-profile-${userId}.${format}`;
    let mimeType = format === "pdf" ? "application/pdf" : "text/csv";

    if (format === "pdf") {
      const pdfLib = await import("pdf-lib");
      // TODO: Build PDF with pdf-lib
      fileBuffer = Buffer.from("PDF export not yet implemented");
    } else if (format === "csv") {
      const { Parser } = await import("json2csv");
      const parser = new Parser();
      fileBuffer = Buffer.from(parser.parse(client));
    } else {
      return res.status(400).json({ error: "Invalid format" });
    }

    // Log export in admin_log
    await supabase.from("admin_log").insert({
      admin_id: adminId,
      action: "export_profile",
      target_user_id: userId,
      details: { format, fileName }
    });

    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", mimeType);
    res.status(200).send(fileBuffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
} 