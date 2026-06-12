import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { DocumentDto } from '@lutron/shared';
import { ViewLayout } from '../components/layout/ViewLayout';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentDto | null>(null);

  useEffect(() => {
    if (!id) return;
    void api.getDocument(id).then(setDoc);
  }, [id]);

  if (!doc) {
    return <ViewLayout title="Document"><Card className="p-8 text-center text-zinc-500">Chargement...</Card></ViewLayout>;
  }

  return (
    <ViewLayout title={doc.title}>
      <Card className="p-6">
        <div className="mb-4 flex gap-4 text-xs text-zinc-600">
          <span>Par {doc.createdBy}</span>
          <span>Mis à jour {new Date(doc.updatedAt).toLocaleString('fr-FR')}</span>
        </div>
        <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
          {doc.content}
        </div>
      </Card>
    </ViewLayout>
  );
}
