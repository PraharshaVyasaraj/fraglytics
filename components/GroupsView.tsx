import React from 'react';
import TeamMetadataPlaceholder from './TeamMetadataPlaceholder';
import { Users } from 'lucide-react';

const GroupsView: React.FC = () => {
  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-6 h-6 text-tactical-red" />
        <h2 className="text-2xl font-serif font-bold text-white uppercase tracking-tight">Team Groups & Metadata</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <TeamMetadataPlaceholder key={i} />
        ))}
      </div>
    </div>
  );
};

export default GroupsView;
