import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ManageHabitsPage } from "./routes/ManageHabitsPage";
import { TrackerPage } from "./routes/TrackerPage";

export function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TrackerPage />} />
        <Route path="/manage" element={<ManageHabitsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
