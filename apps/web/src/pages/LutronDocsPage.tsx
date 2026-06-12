import { ViewLayout } from '../components/layout/ViewLayout';
import { Card } from '../components/ui/Card';

const sections = [
  {
    title: 'Concepts',
    content: 'Le Service est l\'entité centrale. Toutes les ressources, permissions et modules sont rattachés à un service.',
  },
  {
    title: 'Monitoring',
    content: 'Vérifications HTTP, HTTPS, Ping, SSH et commandes. Les états sont calculés par ressource : DOWN > WARNING > UP.',
  },
  {
    title: 'RBAC',
    content: 'Les permissions sont définies dans le code. Les rôles regroupent des permissions et sont attribués par service.',
  },
  {
    title: 'Alertes & Canaux',
    content: 'Les alertes sont générées automatiquement. Configurez Discord/Telegram dans Paramètres LUTRON.',
  },
  {
    title: 'Modules',
    content: 'Architecture plug-and-play : chaque module fournit permissions, routes API et pages front.',
  },
];

export function LutronDocsPage() {
  return (
    <ViewLayout title="Documentation LUTRON">
      <div className="space-y-4">
        {sections.map((s) => (
          <Card key={s.title} className="p-5">
            <h3 className="mb-2 font-semibold text-violet-400">{s.title}</h3>
            <p className="text-sm leading-relaxed text-zinc-400">{s.content}</p>
          </Card>
        ))}
      </div>
    </ViewLayout>
  );
}
