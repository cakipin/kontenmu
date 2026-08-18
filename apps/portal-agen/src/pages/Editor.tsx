import { Puck } from "@puckeditor/core";
import "@puckeditor/core/dist/index.css";
import { BookOpen } from "lucide-react";
import { puckConfig, initialData } from "./puck.config";
import "./LandingPage.css"; // We need the landing page styles so it renders correctly inside the editor

import { useState, useEffect } from "react";

// Function to save data to KV
const save = async (data: any) => {
  try {
    await fetch("/api/puck-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    console.log("Saved to KV successfully");
  } catch (error) {
    console.error("Failed to save to KV", error);
  }
};

export default function Editor() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Load data from KV or use initialData
    fetch("/api/puck-data")
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((kvData) => {
        setData(kvData);
      })
      .catch(() => {
        setData(initialData);
      });
  }, []);

  if (!data)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "var(--primary-color)",
          animation: "pulse 1.5s infinite"
        }}
      >
        <BookOpen size={48} />
      </div>
    );

  return <Puck config={puckConfig} data={data} onPublish={save} />;
}
