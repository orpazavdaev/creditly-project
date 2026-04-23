import styles from "./page.module.css";
import { EventsPanel } from "@/components/EventsPanel";
import { HealthStatus } from "@/components/HealthStatus";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Creditly</h1>
          <p>Next.js App Router with React Query calling the Express API.</p>
          <HealthStatus />
          <EventsPanel />
        </div>
      </main>
    </div>
  );
}
