import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useState, useEffect } from 'react';
import { SoundAsset } from '../types';
import { getSounds, saveSound, deleteSound, updateSoundName } from '../lib/storage';

export function useSoundLibrary() {
  const [library, setLibrary] = useState<SoundAsset[]>([]);

  useEffect(() => {
    const initAndMigrate = async () => {
      try {
        const STORAGE_KEY = 'library_cues_saved_sounds';
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as SoundAsset[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            for (const sound of parsed) {
              await saveSound(sound);
            }
          }
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.error('Error migrating from localStorage to IndexedDB', err);
      }

      const savedSounds = await getSounds();
      setLibrary(savedSounds);
    };

    initAndMigrate();
  }, []);

  const handleKeep = async (asset: SoundAsset) => {
    if (!library.find(a => a.id === asset.id)) {
      setLibrary(prev => [asset, ...prev]);
      await saveSound(asset);
    }
  };

  const handleRemoveFromLibrary = async (id: string) => {
    setLibrary(prev => prev.filter(v => v.id !== id));
    await deleteSound(id);
  };

  const handleRenameLibraryAsset = async (id: string, newName: string) => {
    setLibrary(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));
    await updateSoundName(id, newName);
  };

  const exportKit = async () => {
    if (library.length === 0) return;
    
    const zip = new JSZip();
    library.forEach((asset) => {
      const fileName = `${asset.name.replace(/\s+/g, '_')}.wav`;
      zip.file(`Sounds/${fileName}`, asset.audioBase64, { base64: true });
    });
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'library_cues_kit.zip');
  };

  return {
    library,
    handleKeep,
    handleRemoveFromLibrary,
    handleRenameLibraryAsset,
    exportKit
  };
}
