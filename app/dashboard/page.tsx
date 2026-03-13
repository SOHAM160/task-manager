import AnalyticsDashboard from "@/components/AnalyticsDashboard";

export default function Dashboard() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        padding: "32px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <AnalyticsDashboard />
    </div>
  );
}