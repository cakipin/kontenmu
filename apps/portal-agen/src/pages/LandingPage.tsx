import { useEffect, useState } from "react";
import { Render } from "@puckeditor/core";
import { puckConfig, initialData } from "./puck.config";
import "./LandingPage.css";
import { SchmuChatWidget } from "../components/SchmuChatWidget";
import { useAppData } from "../data/appData";

export default function LandingPage() {
  const { data: simData } = useAppData();
  const [data, setData] = useState<any>(() => initialData);

  useEffect(() => {
    const html = document.documentElement;
    const root = document.getElementById("root");
    const previous = {
      htmlOverflow: html.style.getPropertyValue("overflow"),
      htmlPriority: html.style.getPropertyPriority("overflow"),
      bodyOverflow: document.body.style.getPropertyValue("overflow"),
      bodyPriority: document.body.style.getPropertyPriority("overflow"),
      rootOverflow: root?.style.getPropertyValue("overflow") || "",
      rootPriority: root?.style.getPropertyPriority("overflow") || "",
    };

    // The shared admin stylesheet locks the app shell to a viewport. Landing needs document scrolling.
    html.style.setProperty("overflow", "auto", "important");
    document.body.style.setProperty("overflow", "auto", "important");
    root?.style.setProperty("overflow", "visible", "important");

    return () => {
      html.style.setProperty(
        "overflow",
        previous.htmlOverflow,
        previous.htmlPriority,
      );
      document.body.style.setProperty(
        "overflow",
        previous.bodyOverflow,
        previous.bodyPriority,
      );
      if (root)
        root.style.setProperty(
          "overflow",
          previous.rootOverflow,
          previous.rootPriority,
        );
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 6000);

    fetch("/api/puck-data", { cache: "no-store", signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((kvData) => {
        setData(kvData);
      })
      .catch(() => {
        // Keep the built-in landing visible when remote editor data is unavailable.
      })
      .finally(() => window.clearTimeout(timeoutId));

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return (
    <>
      <Render config={puckConfig} data={data} />
      {simData.isChatWidgetEnabled && <SchmuChatWidget />}
    </>
  );
}
