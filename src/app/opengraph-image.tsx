import { ImageResponse } from "next/og";

export const alt = "Yeyder Otero — Portafolio de proyectos y desarrollo web";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0a0a0f",
          color: "#f5f5f5",
          padding: 80,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 72,
            left: 80,
            width: 96,
            height: 96,
            borderRadius: 18,
            background: "#00d4aa",
            color: "#0a0a0f",
            fontSize: 58,
            fontWeight: 700,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Y
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            height: "100%",
            marginLeft: 150,
          }}
        >
          <div style={{ display: "flex", width: 2, background: "#00d4aa" }} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: 56,
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#00d4aa",
                fontSize: 22,
                letterSpacing: 6,
                marginBottom: 28,
              }}
            >
              PORTAFOLIO
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 84,
                fontWeight: 700,
                letterSpacing: -2,
                lineHeight: 1.05,
              }}
            >
              Yeyder Otero
            </div>
            <div
              style={{
                display: "flex",
                color: "#a3a3a3",
                fontSize: 32,
                marginTop: 26,
              }}
            >
              Estudiante de Ingeniería Informática
            </div>
            <div
              style={{
                display: "flex",
                color: "#737373",
                fontSize: 24,
                marginTop: 18,
              }}
            >
              Portafolio · Proyectos y desarrollo web
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
