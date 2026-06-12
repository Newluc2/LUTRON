import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { DocumentDto } from '@lutron/shared';
import { ViewLayout } from '../components/layout/ViewLayout';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    void api.getDocuments().then(setDocuments);
  }, []);

  const filtered = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.createdBy.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <ViewLayout title="Documentation" search={search} onSearchChange={setSearch} searchPlaceholder="Rechercher un document...">
      <Card>
        <div className="divide-y divide-lutron-border">
          {filtered.map((doc) => (
            <Link key={doc.id} to={`/documents/${doc.id}`} className="block px-5 py-4 transition-colors hover:bg-lutron-card-hover">
              <div className="flex items-center justify-between">
                <p className="font-medium">{doc.title}</p>
                <span className="text-xs text-zinc-600">{new Date(doc.updatedAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{doc.content}</p>
              <p className="mt-2 text-xs text-zinc-600">Par {doc.createdBy}</p>
            </Link>
          ))}
        </div>
      </Card>
    </ViewLayout>
  );
}
