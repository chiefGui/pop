import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../../ui/button";
import { Feedback } from "../../../ui/feedback";

import { cityDistricts } from "./districts";
import type { CityDistrict } from "./districts";
import type { CityMapRenderer } from "./map-renderer";

export function CityMap({ districts = cityDistricts }: { districts?: readonly CityDistrict[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const renderer = useRef<CityMapRenderer | undefined>(undefined);
  const latestDistricts = useRef(districts);

  useEffect(() => {
    latestDistricts.current = districts;
    renderer.current?.updateDistricts(districts);
  }, [districts]);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let cancelled = false;
    void import("./map-renderer")
      .then(({ mountCityMap }) => {
        if (!cancelled) renderer.current = mountCityMap(element, setError, latestDistricts.current);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        console.error("Could not initialize the city map", cause);
        setError("The map could not start. Try again.");
      });
    return () => {
      cancelled = true;
      renderer.current?.dispose();
      renderer.current = undefined;
    };
  }, [attempt]);

  function retry() {
    setError(null);
    setAttempt((current) => current + 1);
  }

  return (
    <>
      <canvas
        ref={canvas}
        role="img"
        aria-label="City district map"
        {...stylex.props(styles.canvas)}
      />
      {error && (
        <div {...stylex.props(styles.failure)}>
          <Feedback error={error} />
          <Button variant="secondary" xstyle={styles.retry} onClick={retry}>
            Retry map
          </Button>
        </div>
      )}
    </>
  );
}

const styles = stylex.create({
  canvas: { display: "block", width: "100%", height: "100%", backgroundColor: "#000" },
  failure: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    pointerEvents: "none",
  },
  retry: { pointerEvents: "auto" },
});
