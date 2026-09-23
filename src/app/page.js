"use client";
import { useEffect, useState } from "react";
import api from "@/lib/axios";

export default function Home() {
  const [msg, setMsg] = useState("loading...");

  useEffect(() => {
    api.get("/products?limit=1").then((res) => {
      setMsg(res.data.products[0].title);
    });
  }, []);

  return <div className="p-8 text-xl">{msg}</div>;
}