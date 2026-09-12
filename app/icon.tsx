import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: "#0f172a",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#38bdf8",
          borderRadius: "6px",
          border: "1px solid #38bdf8",
          fontWeight: 900,
        }}
      >
        🛡️
      </div>
    ),
    {
      ...size,
    }
  );
}
