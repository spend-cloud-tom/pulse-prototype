import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles, CheckCircle2, ShoppingCart, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrchestrationFlowProps {
  activeStage?: number; // 0-4 for which node is "active"
  pulseTitle?: string;
  compact?: boolean;
}

// Custom node component
const WorkflowNode = ({ data }: { data: any }) => {
  const isActive = data.isActive;
  const isCompleted = data.isCompleted;
  const Icon = data.icon;

  return (
    <motion.div
      initial={false}
      animate={{
        scale: isActive ? 1.1 : 1,
        boxShadow: isActive 
          ? '0 0 20px rgba(20, 184, 166, 0.4)' 
          : '0 1px 3px rgba(0,0,0,0.1)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        "px-4 py-3 rounded-xl border-2 bg-card min-w-[100px] text-center transition-colors",
        isActive && "border-hero-teal bg-hero-teal-soft/30",
        isCompleted && !isActive && "border-signal-green/50 bg-signal-green-bg/30",
        !isActive && !isCompleted && "border-border"
      )}
    >
      <div className="flex flex-col items-center gap-1.5">
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center",
          isActive && "bg-hero-teal text-white",
          isCompleted && !isActive && "bg-signal-green text-white",
          !isActive && !isCompleted && "bg-secondary text-muted-foreground"
        )}>
          {isCompleted && !isActive ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </div>
        <span className={cn(
          "text-xs font-medium",
          isActive && "text-hero-teal",
          isCompleted && !isActive && "text-signal-green",
          !isActive && !isCompleted && "text-muted-foreground"
        )}>
          {data.label}
        </span>
        {data.sublabel && (
          <span className="text-[10px] text-muted-foreground">{data.sublabel}</span>
        )}
      </div>
      
      {/* Active pulse indicator */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          <span className="text-[10px] font-medium text-hero-teal bg-hero-teal-soft/50 px-2 py-0.5 rounded-full">
            Processing...
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

const nodeTypes = {
  workflow: WorkflowNode,
};

const OrchestrationFlowInner = ({ 
  activeStage = 1, 
  pulseTitle = "Medical supplies request",
  compact = false 
}: OrchestrationFlowProps) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [currentStage, setCurrentStage] = useState(activeStage);

  // Auto-animate through stages for demo
  useEffect(() => {
    if (!isExpanded) return;
    
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % 5);
    }, 3000);

    return () => clearInterval(interval);
  }, [isExpanded]);

  const initialNodes: Node[] = [
    {
      id: 'care-worker',
      type: 'workflow',
      position: { x: 0, y: 50 },
      data: { 
        label: 'Care Worker', 
        sublabel: 'Anouk',
        icon: User,
        isActive: currentStage === 0,
        isCompleted: currentStage > 0,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: 'ai-engine',
      type: 'workflow',
      position: { x: 160, y: 50 },
      data: { 
        label: 'AI Engine', 
        sublabel: 'Classification',
        icon: Sparkles,
        isActive: currentStage === 1,
        isCompleted: currentStage > 1,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: 'team-lead',
      type: 'workflow',
      position: { x: 320, y: 50 },
      data: { 
        label: 'Team Lead', 
        sublabel: 'Jolanda',
        icon: User,
        isActive: currentStage === 2,
        isCompleted: currentStage > 2,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: 'procurement',
      type: 'workflow',
      position: { x: 480, y: 50 },
      data: { 
        label: 'Procurement', 
        sublabel: 'Sarah',
        icon: ShoppingCart,
        isActive: currentStage === 3,
        isCompleted: currentStage > 3,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
    {
      id: 'finance',
      type: 'workflow',
      position: { x: 640, y: 50 },
      data: { 
        label: 'Finance', 
        sublabel: 'Rohan',
        icon: Calculator,
        isActive: currentStage === 4,
        isCompleted: currentStage > 4,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    },
  ];

  const initialEdges: Edge[] = [
    {
      id: 'e1-2',
      source: 'care-worker',
      target: 'ai-engine',
      animated: currentStage === 0,
      style: { stroke: currentStage > 0 ? '#10b981' : '#e2e8f0', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: currentStage > 0 ? '#10b981' : '#e2e8f0' },
    },
    {
      id: 'e2-3',
      source: 'ai-engine',
      target: 'team-lead',
      animated: currentStage === 1,
      style: { stroke: currentStage > 1 ? '#10b981' : '#e2e8f0', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: currentStage > 1 ? '#10b981' : '#e2e8f0' },
    },
    {
      id: 'e3-4',
      source: 'team-lead',
      target: 'procurement',
      animated: currentStage === 2,
      style: { stroke: currentStage > 2 ? '#10b981' : '#e2e8f0', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: currentStage > 2 ? '#10b981' : '#e2e8f0' },
    },
    {
      id: 'e4-5',
      source: 'procurement',
      target: 'finance',
      animated: currentStage === 3,
      style: { stroke: currentStage > 3 ? '#10b981' : '#e2e8f0', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: currentStage > 3 ? '#10b981' : '#e2e8f0' },
    },
  ];

  // Update nodes when stage changes
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node, index) => ({
        ...node,
        data: {
          ...node.data,
          isActive: currentStage === index,
          isCompleted: currentStage > index,
        },
      }))
    );
    setEdges((eds) =>
      eds.map((edge, index) => ({
        ...edge,
        animated: currentStage === index,
        style: { 
          stroke: currentStage > index ? '#10b981' : '#e2e8f0', 
          strokeWidth: 2 
        },
        markerEnd: { 
          type: MarkerType.ArrowClosed, 
          color: currentStage > index ? '#10b981' : '#e2e8f0' 
        },
      }))
    );
  }, [currentStage, setNodes, setEdges]);

  const stageLabels = ['Submitted', 'AI Processing', 'Approval', 'Ordering', 'Reconciliation'];

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-hero-purple-soft flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-hero-purple" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Orchestration Flow</p>
            <p className="text-xs text-muted-foreground">
              {pulseTitle} · Stage {currentStage + 1}/5: {stageLabels[currentStage]}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Flow visualization */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 180, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border/50"
          >
            <div style={{ width: '100%', height: 180 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag={false}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              preventScrolling={false}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#f1f5f9" gap={16} />
            </ReactFlow>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const OrchestrationFlow = (props: OrchestrationFlowProps) => (
  <ReactFlowProvider>
    <OrchestrationFlowInner {...props} />
  </ReactFlowProvider>
);

export default OrchestrationFlow;
