"use client";
import dynamic from "next/dynamic";
import React from "react";

const Mail = dynamic(
  () => {
    return import("./mail");
  },
  {
    ssr: false,
    loading: () => <div>Loading...</div>, // Display loading state while component is loading
  },
);

const MailDashboard = () => {
  return (
    <div>
      <Mail
        defaultLayout={[24, 30, 46]}
        defaultCollapsed={false}
        navCollasedSize={5}
      />
    </div>
  );
};

export default MailDashboard;
