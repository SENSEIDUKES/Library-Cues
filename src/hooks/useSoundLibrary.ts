import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useState, useEffect } from 'react';
import { SoundAsset, SoundKit } from '../types';
import { getSounds, saveSound, saveSounds, deleteSound, updateSoundName, getKits, saveKit, deleteKit } from '../lib/storage';
import { bakeEffectsOnClientSide } from '../lib/audio';

export function useSoundLibrary() {
  const [library, setLibrary] = useState<SoundAsset[]>([]);
  const [kits, setKits] = useState<SoundKit[]>([]);

  useEffect(() => {
    const initAndMigrate = async () => {
      try {
        const STORAGE_KEY = 'library_cues_saved_sounds';
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as SoundAsset[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            await saveSounds(parsed);
          }
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.error('Error migrating from localStorage to IndexedDB', err);
      }

      const savedSounds = await getSounds();
      setLibrary(savedSounds);

      const savedKits = await getKits();
      setKits(savedKits);
    };

    initAndMigrate();
  }, []);

  const handleKeep = async (asset: SoundAsset) => {
    if (!library.find(a => a.id === asset.id)) {
      setLibrary(prev => [asset, ...prev]);
      await saveSound(asset);
    }
  };

  const handleBulkKeep = async (assets: SoundAsset[]) => {
    const newAssets = assets.filter(asset => !library.find(a => a.id === asset.id));
    if (newAssets.length > 0) {
      setLibrary(prev => [...newAssets, ...prev]);
      await saveSounds(newAssets);
    }
  };

  const handleRemoveFromLibrary = async (id: string) => {
    setLibrary(prev => prev.filter(v => v.id !== id));
    // Also remove from any kits containing this sound
    setKits(prev => prev.map(k => {
      if (k.soundIds.includes(id)) {
        const updated = { ...k, soundIds: k.soundIds.filter(sid => sid !== id) };
        saveKit(updated);
        return updated;
      }
      return k;
    }));
    await deleteSound(id);
  };

  const handleBulkRemoveFromLibrary = async (ids: string[]) => {
    setLibrary(prev => prev.filter(v => !ids.includes(v.id)));
    // Also remove from any kits containing these sounds
    setKits(prev => prev.map(k => {
      const hasAny = k.soundIds.some(id => ids.includes(id));
      if (hasAny) {
        const updated = { ...k, soundIds: k.soundIds.filter(id => !ids.includes(id)) };
        saveKit(updated);
        return updated;
      }
      return k;
    }));
    for (const id of ids) {
      await deleteSound(id);
    }
  };

  const handleRenameLibraryAsset = async (id: string, newName: string) => {
    setLibrary(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));
    await updateSoundName(id, newName);
  };

  const handleUpdateAsset = async (updatedAsset: SoundAsset) => {
    setLibrary(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    await saveSound(updatedAsset);
  };

  // Kit operations
  const handleCreateKit = async (name: string, description?: string) => {
    const newKit: SoundKit = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      name,
      createdAt: Date.now(),
      description,
      soundIds: []
    };
    setKits(prev => [newKit, ...prev]);
    await saveKit(newKit);
    return newKit;
  };

  const handleDeleteKit = async (id: string) => {
    setKits(prev => prev.filter(k => k.id !== id));
    await deleteKit(id);
  };

  const handleRenameKit = async (id: string, name: string) => {
    setKits(prev => prev.map(k => k.id === id ? { ...k, name } : k));
    const targetKit = kits.find(k => k.id === id);
    if (targetKit) {
      await saveKit({ ...targetKit, name });
    }
  };

  const handleAssignSoundToKit = async (kitId: string, soundId: string) => {
    setKits(prev => prev.map(k => {
      if (k.id === kitId) {
        if (!k.soundIds.includes(soundId)) {
          const updated = { ...k, soundIds: [...k.soundIds, soundId] };
          saveKit(updated);
          return updated;
        }
      }
      return k;
    }));
  };

  const handleRemoveSoundFromKit = async (kitId: string, soundId: string) => {
    setKits(prev => prev.map(k => {
      if (k.id === kitId) {
        const updated = { ...k, soundIds: k.soundIds.filter(id => id !== soundId) };
        saveKit(updated);
        return updated;
      }
      return k;
    }));
  };

  const handleBulkAssignSoundsToKit = async (kitId: string, soundIds: string[]) => {
    setKits(prev => prev.map(k => {
      if (k.id === kitId) {
        const uniqueIds = Array.from(new Set([...k.soundIds, ...soundIds]));
        const updated = { ...k, soundIds: uniqueIds };
        saveKit(updated);
        return updated;
      }
      return k;
    }));
  };

  const handleBulkRemoveSoundsFromKit = async (kitId: string, soundIds: string[]) => {
    setKits(prev => prev.map(k => {
      if (k.id === kitId) {
        const updated = { ...k, soundIds: k.soundIds.filter(id => !soundIds.includes(id)) };
        saveKit(updated);
        return updated;
      }
      return k;
    }));
  };

  const exportKit = async (assetsToExport?: SoundAsset[]) => {
    const assets = assetsToExport && assetsToExport.length > 0 ? assetsToExport : library;
    if (assets.length === 0) return;
    
    const zip = new JSZip();
    const usedNames = new Set<string>();
    
    const hasEffects = (asset: SoundAsset) => {
      return (asset.playbackRate !== undefined && asset.playbackRate !== 1) ||
             (asset.filterFreq !== undefined && asset.filterFreq !== 20000) ||
             (asset.delayFeedback !== undefined && asset.delayFeedback !== 0) ||
             (asset.reverbAmount !== undefined && asset.reverbAmount !== 0);
    };

    const promises = assets.map(async (asset) => {
      let ext = 'mp3';
      if (asset.mimeType?.includes('wav')) {
        ext = 'wav';
      } else if (asset.mimeType?.includes('ogg')) {
        ext = 'ogg';
      } else if (asset.mimeType?.includes('aac')) {
        ext = 'aac';
      }
      
      let base64 = asset.audioBase64;
      
      if (hasEffects(asset)) {
        try {
          const decoded = await bakeEffectsOnClientSide(
            asset.audioBase64,
            asset.mimeType,
            asset.playbackRate || 1,
            asset.filterFreq !== undefined ? asset.filterFreq : 20000,
            asset.delayFeedback || 0,
            asset.reverbAmount || 0
          );
          base64 = decoded.audioBase64;
          ext = 'wav';
        } catch (err) {
          console.error(`Failed to bake effects during export for asset ${asset.name}:`, err);
        }
      }
      
      const baseName = asset.name.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'SFX';
      let fileName = `${baseName}.${ext}`;
      let counter = 1;
      while (usedNames.has(fileName)) {
        fileName = `${baseName}_${counter}.${ext}`;
        counter++;
      }
      usedNames.add(fileName);
      
      zip.file(`Sounds/${fileName}`, base64, { base64: true });
    });
    
    await Promise.all(promises);
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'library_cues_kit.zip');
  };

  return {
    library,
    kits,
    handleKeep,
    handleBulkKeep,
    handleRemoveFromLibrary,
    handleBulkRemoveFromLibrary,
    handleRenameLibraryAsset,
    handleUpdateAsset,
    handleCreateKit,
    handleDeleteKit,
    handleRenameKit,
    handleAssignSoundToKit,
    handleRemoveSoundFromKit,
    handleBulkAssignSoundsToKit,
    handleBulkRemoveSoundsFromKit,
    exportKit
  };
}
