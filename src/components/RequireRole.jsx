import { Navigate } from "react-router-dom";
import { useActor } from "../context/ActorContext";

export default function RequireRole({ role, children }) {
  const { actor } = useActor();
  if (!actor) return <Navigate to="/" replace />;
  if (actor.role !== role) return <Navigate to={`/${actor.role}`} replace />;
  return children;
}
