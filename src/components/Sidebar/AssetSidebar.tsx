'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/components/Providers';
import {
  Globe,
  Map,
  Compass,
  Layers,
  CheckCircle2,
  Folder,
  FolderOpen,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  AlertTriangle,
  MoveLeft,
  MoveRight
} from 'lucide-react';

interface AssetNode {
  id: number | string;
  name: string;
  type: 'Country' | 'State/Province' | 'GeoBasin' | 'Field' | 'Well' | 'Slot' | 'Folder' | 'Plan' | 'Survey';
  parent_id?: number | null;
  isDefinite?: boolean;
  slotId?: number;
  children?: AssetNode[];
}

export default function AssetSidebar() {
  const {
    user,
    selectedSlotId,
    setSelectedSlotId,
    selectedTrajectoryId,
    setSelectedTrajectoryId,
    selectedTrajectoryType,
    setSelectedTrajectoryType,
    refreshTrigger,
    triggerRefreshTree,
  } = useApp();

  const [treeData, setTreeData] = useState<AssetNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [width, setWidth] = useState(280); // in pixels
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [idleTime, setIdleTime] = useState(0);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: AssetNode;
  } | null>(null);

  // Modal State for adding asset
  const [addModal, setAddModal] = useState<{
    show: boolean;
    parentType: string;
    parentId: number | null;
    childType: string;
  } | null>(null);
  const [newAssetName, setNewAssetName] = useState('');

  // Dragging ref
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  // 1. Fetch tree data
  const fetchTree = async () => {
    try {
      const res = await fetch('/api/assets');
      if (res.ok) {
        const data = await res.json();
        setTreeData(data);

        // Auto-select project if only one Slot exists
        const slots: { id: number | string, pathIds: string[] }[] = [];
        const findSlots = (nodes: AssetNode[], currentPath: string[]) => {
          for (const n of nodes) {
            const path = [...currentPath, String(n.id)];
            if (n.type === 'Slot') slots.push({ id: n.id, pathIds: path });
            if (n.children) findSlots(n.children, path);
          }
        };
        findSlots(data, []);

        if (slots.length === 1 && !selectedSlotId) {
          setSelectedSlotId(Number(slots[0].id));
          setExpandedNodes(prev => {
            const next = { ...prev };
            slots[0].pathIds.forEach(id => { next[id] = true; });
            return next;
          });
        }
      }
    } catch (err) {
      console.error('Error fetching asset tree:', err);
    }
  };

  useEffect(() => {
    fetchTree();
  }, [refreshTrigger]);

  // 2. Idle Timer for Auto-Hide (30 Seconds)
  useEffect(() => {
    const handleActivity = () => {
      setIdleTime(0);
      setIsCollapsed(false); // bring back on activity
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('pointerdown', handleActivity);

    const interval = setInterval(() => {
      setIdleTime((prev) => {
        const nextTime = prev + 1;
        if (nextTime >= 30) {
          setIsCollapsed(true);
        }
        return nextTime;
      });
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('pointerdown', handleActivity);
      clearInterval(interval);
    };
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // 3. Draggable Sidebar resizing handlers
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    document.body.style.cursor = 'col-resize';
  };

  const handleResize = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX;
    if (newWidth > 200 && newWidth < 500) {
      setWidth(newWidth);
    }
  };

  const stopResize = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    document.body.style.cursor = '';
  };

  // Toggle node expansion
  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  // Right-click event handler
  const handleContextMenu = (e: React.MouseEvent, node: AssetNode) => {
    if (node.type !== 'Plan' && node.type !== 'Survey') return;
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node,
    });
  };

  // Mark trajectory as Definite
  const handleMarkDefinite = async (node: AssetNode) => {
    try {
      const res = await fetch(`/api/trajectories/${node.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefinite: true }),
      });
      if (res.ok) {
        triggerRefreshTree();
      }
    } catch (err) {
      console.error('Error setting definite:', err);
    }
  };

  // Delete trajectory or asset
  const handleDeleteNode = async (node: AssetNode) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete this ${node.type}: "${node.name}"?`);
    if (!confirmDelete) return;

    try {
      if (node.type === 'Plan' || node.type === 'Survey') {
        const res = await fetch(`/api/trajectories/${node.id}`, { method: 'DELETE' });
        if (res.ok) {
          if (selectedTrajectoryId === node.id) {
            setSelectedTrajectoryId(null);
            setSelectedTrajectoryType(null);
          }
          triggerRefreshTree();
        }
      } else {
        const res = await fetch(`/api/assets?id=${node.id}`, { method: 'DELETE' });
        if (res.ok) {
          if (selectedSlotId === node.id && node.type === 'Slot') {
            setSelectedSlotId(null);
            setSelectedTrajectoryId(null);
            setSelectedTrajectoryType(null);
          }
          triggerRefreshTree();
        }
      }
    } catch (err) {
      console.error('Error deleting node:', err);
    }
  };

  // Add Asset API handler
  const handleAddAsset = async () => {
    if (!newAssetName.trim() || !addModal) return;
    
    try {
      if (addModal.childType === 'Plan' || addModal.childType === 'Survey') {
        // Create trajectory
        const res = await fetch('/api/trajectories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slot_id: addModal.parentId,
            name: newAssetName,
            type: addModal.childType,
            is_definite: false,
          }),
        });
        if (res.ok) {
          triggerRefreshTree();
        }
      } else {
        // Create standard asset
        const res = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newAssetName,
            type: addModal.childType,
            parent_id: addModal.parentId,
          }),
        });
        if (res.ok) {
          triggerRefreshTree();
        }
      }
    } catch (err) {
      console.error('Error adding asset:', err);
    } finally {
      setNewAssetName('');
      setAddModal(null);
    }
  };

  // Click handler to load a Plan or Survey
  const handleNodeClick = (node: AssetNode) => {
    if (node.type === 'Plan' || node.type === 'Survey') {
      setSelectedSlotId(node.slotId || null);
      setSelectedTrajectoryId(Number(node.id));
      setSelectedTrajectoryType(node.type);
    }
  };

  // Get Node Icon
  const getNodeIcon = (type: string, isExpanded?: boolean) => {
    switch (type) {
      case 'Country': return <Globe className="h-4 w-4 text-sky-500" />;
      case 'State/Province': return <Map className="h-4 w-4 text-emerald-500" />;
      case 'GeoBasin': return <Compass className="h-4 w-4 text-amber-500" />;
      case 'Field': return <Layers className="h-4 w-4 text-violet-500" />;
      case 'Well':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-indigo-500">
            <path d="M12 2L3 22h18L12 2zM12 7v8M10 17h4" />
          </svg>
        );
      case 'Slot':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-rose-500">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        );
      case 'Folder':
        return isExpanded ? <FolderOpen className="h-4 w-4 text-yellow-500" /> : <Folder className="h-4 w-4 text-yellow-500" />;
      case 'Plan':
      case 'Survey':
        return <FileText className="h-4 w-4 text-slate-400 dark:text-slate-500" />;
      default:
        return null;
    }
  };

  // Render tree node recursively
  const renderNode = (node: AssetNode, depth = 0) => {
    const key = `${node.type}-${node.id}`;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[key] || false;
    const isSelected = (node.type === 'Plan' || node.type === 'Survey') && selectedTrajectoryId === node.id;
    
    // Determine next level type
    let childType = '';
    if (node.type === 'Country') childType = 'State/Province';
    else if (node.type === 'State/Province') childType = 'GeoBasin';
    else if (node.type === 'GeoBasin') childType = 'Field';
    else if (node.type === 'Field') childType = 'Well';
    else if (node.type === 'Well') childType = 'Slot';
    else if (node.type === 'Folder') childType = node.name === 'Plans' ? 'Plan' : 'Survey';

    return (
      <div key={key} className="select-none">
        {/* Node label */}
        <div
          onContextMenu={(e) => handleContextMenu(e, node)}
          onClick={() => {
            if (node.type === 'Plan' || node.type === 'Survey') {
              handleNodeClick(node);
            } else {
              toggleExpand(key);
            }
          }}
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 text-xs transition-colors rounded-sm cursor-pointer ${
            isSelected
              ? 'bg-sky-50 text-sky-700 font-semibold dark:bg-sky-950/30 dark:text-sky-400'
              : 'hover:bg-slate-100/70 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center space-x-2 truncate">
            {/* Expand / collapse arrow */}
            {node.type !== 'Plan' && node.type !== 'Survey' ? (
              <span className="text-slate-400 dark:text-slate-600">
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </span>
            ) : (
              <span className="w-3.5" /> // spacer
            )}

            {/* Icon */}
            {getNodeIcon(node.type, isExpanded)}

            {/* Label text */}
            <span className="truncate">{node.name}</span>

            {/* Definite indicator */}
            {node.isDefinite && (
              <span title="Definite Active Baseline" className="shrink-0 flex items-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-sky-500 fill-sky-50 dark:fill-slate-900" />
              </span>
            )}
          </div>

          {/* Quick Actions (only for authenticated users) */}
          {user && (
            <div className="hidden group-hover:flex items-center space-x-1 shrink-0 bg-transparent px-1">
              {childType && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const parentIdNum = typeof node.id === 'number' ? node.id : parseInt((node.id as string).split('-').pop() || '', 10);
                    setAddModal({
                      show: true,
                      parentType: node.type,
                      parentId: parentIdNum,
                      childType: childType,
                    });
                  }}
                  className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  title={`Add ${childType}`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              )}
              {node.type !== 'Folder' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNode(node);
                  }}
                  className="rounded-sm p-0.5 text-slate-400 hover:bg-slate-200 hover:text-rose-500 dark:hover:bg-slate-700"
                  title={`Delete ${node.type}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Children rendering */}
        {hasChildren && isExpanded && (
          <div className="mt-0.5 border-l border-slate-200/50 dark:border-slate-800/30 ml-2.5">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        ref={sidebarRef}
        style={{ width: isCollapsed ? '0px' : `${width}px` }}
        className={`relative flex h-full flex-col border-r border-slate-200 bg-white/70 backdrop-blur-xs transition-all duration-300 dark:border-slate-800 dark:bg-[#0b0f19]/60 shrink-0 ${
          isCollapsed ? 'overflow-hidden border-r-0' : ''
        }`}
      >
        {/* Header Ribbon */}
        <div className="flex h-10 items-center justify-between border-b border-slate-200/60 px-4 dark:border-slate-800/60 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Asset Hierarchy
          </span>
          <div className="flex items-center space-x-1">
            {user && (
              <button
                onClick={() =>
                  setAddModal({
                    show: true,
                    parentType: 'Root',
                    parentId: null,
                    childType: 'Country',
                  })
                }
                className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                title="Add Country at Root"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => setIsCollapsed(true)}
              className="rounded-sm p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Auto-collapse Sidebar"
            >
              <MoveLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Tree Container */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {treeData.length > 0 ? (
            treeData.map((node) => renderNode(node))
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400 dark:text-slate-600">
              <AlertTriangle className="h-5 w-5 mb-1.5" />
              <span className="text-xs">No assets loaded.</span>
            </div>
          )}
        </div>

        {/* Draggable Resize Handle */}
        <div
          onMouseDown={startResizing}
          className="absolute top-0 right-0 z-50 h-full w-1.5 drag-handle hover:bg-sky-500/20 active:bg-sky-500/50 transition-colors"
        />
      </div>

      {/* Manual Collapse Tab Trigger */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed bottom-14 left-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 text-sky-600 dark:text-sky-400 hover:scale-105 active:scale-95 transition-all"
          title="Open Asset Sidebar"
        >
          <MoveRight className="h-5 w-5" />
        </button>
      )}

      {/* --- RIGHT CLICK CONTEXT MENU --- */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 min-w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-800 dark:bg-[#111827]"
        >
          <button
            onClick={() => handleMarkDefinite(contextMenu.node)}
            className="flex w-full items-center space-x-2 px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-800/80 hover:text-sky-600"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-sky-500" />
            <span>Mark as Definite</span>
          </button>
          <button
            onClick={() => handleDeleteNode(contextMenu.node)}
            className="flex w-full items-center space-x-2 px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            <span>Delete Iteration</span>
          </button>
        </div>
      )}

      {/* --- ADD ASSET MODAL --- */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-[#111827]">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Create New {addModal.childType}
            </h3>
            {addModal.parentType !== 'Root' && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                Under {addModal.parentType} ID: {addModal.parentId}
              </p>
            )}
            <div className="mt-4">
              <input
                type="text"
                required
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddAsset();
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                placeholder={`Name of ${addModal.childType}...`}
                autoFocus
              />
            </div>
            <div className="mt-5 flex justify-end space-x-2 text-xs">
              <button
                onClick={() => setAddModal(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAsset}
                className="rounded-lg bg-sky-600 hover:bg-sky-500 px-4 py-2 font-semibold text-white transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
