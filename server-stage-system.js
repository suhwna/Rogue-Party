function getNodeGameplayKind(node) {
  if (!node) return "combat";
  return node.resolvedKind || node.kind || "combat";
}

function getMapNode(stageMap, nodeId) {
  return stageMap ? stageMap.nodes.find((node) => node.id === nodeId) || null : null;
}

function getAvailableMapNodes(room) {
  if (!room.stageMap) return [];
  if (!room.currentMapNodeId) {
    return room.stageMap.nodes.filter((node) => node.depth === 1);
  }
  const current = getMapNode(room.stageMap, room.currentMapNodeId);
  if (!current) return [];
  return (current.nextIds || []).map((id) => getMapNode(room.stageMap, id)).filter(Boolean);
}

function countMapVotes(mapVotes) {
  const counts = {};
  for (const nodeId of Object.values(mapVotes || {})) {
    counts[nodeId] = (counts[nodeId] || 0) + 1;
  }
  return counts;
}

function pickVoteWinner(available, counts, random = Math.random) {
  let bestCount = -1;
  let best = [];
  for (const node of available || []) {
    const count = counts[node.id] || 0;
    if (count > bestCount) {
      bestCount = count;
      best = [node.id];
    } else if (count === bestCount) {
      best.push(node.id);
    }
  }
  return best.length ? best[Math.floor(random() * best.length)] : null;
}

function getMapNodeView(room, node, options = {}) {
  const getModifier = options.getModifier || (() => null);
  const getBossProfile = options.getBossProfile || (() => null);
  const stageNodeMetaView = options.stageNodeMetaView || ((value) => value);
  const riskView = options.riskView || ((value) => value);
  const bossProfileView = options.bossProfileView || ((value) => value);
  const voteCounts = options.voteCounts || countMapVotes(room.mapVotes);
  const bossProfile = getNodeGameplayKind(node) === "boss" ? getBossProfile(node) : null;
  return {
    id: node.id,
    floor: node.floor,
    depth: node.depth,
    lane: node.lane,
    kind: node.kind,
    resolvedKind: node.resolvedKind || "",
    stage: stageNodeMetaView(node),
    modifier: riskView(getModifier(node)),
    boss: bossProfileView(bossProfile),
    votes: voteCounts[node.id] || 0
  };
}

function refreshMapChoices(room, options = {}) {
  const mapNodeView = options.mapNodeView || ((node) => node);
  const availableNodes = options.availableNodes || getAvailableMapNodes(room);
  room.mapChoices = availableNodes.map((node) => mapNodeView(node));
  return room.mapChoices;
}

function ensureMapProgression(room, options = {}) {
  const maxChapters = options.maxChapters || room.floor || 1;
  const generateStageMap = options.generateStageMap;
  const availableNodes = getAvailableMapNodes(room);
  if (availableNodes.length > 0) {
    return { status: "available", availableNodes };
  }
  if (room.floor >= maxChapters) {
    return { status: "complete", availableNodes: [] };
  }
  if (typeof generateStageMap !== "function") {
    return { status: "blocked", availableNodes: [] };
  }
  room.floor += 1;
  room.stageMap = generateStageMap(room.floor);
  room.currentMapNodeId = null;
  room.activeMapNode = null;
  room.mapPath = [];
  return { status: "advanced", availableNodes: getAvailableMapNodes(room) };
}

function applyMapNodeStart(room, node, options = {}) {
  const resolveRandomStageKind = options.resolveRandomStageKind || (() => "");
  const getModifier = options.getModifier || (() => null);
  const getBossProfile = options.getBossProfile || (() => null);
  if (node.kind === "random") {
    node.resolvedKind = resolveRandomStageKind(node);
  } else {
    node.resolvedKind = "";
  }
  const modifier = getModifier(node);
  const gameplayKind = getNodeGameplayKind(node);
  const bossProfile = gameplayKind === "boss" ? getBossProfile(node) : null;
  room.currentMapNodeId = node.id;
  room.activeMapNode = node;
  room.activeRisk = modifier;
  room.stageIndex += 1;
  room.wave = room.stageIndex;
  room.mapChoices = [];
  room.mapVotes = {};
  room.mapDeadline = 0;
  if (!room.mapPath.includes(node.id)) room.mapPath.push(node.id);
  return { modifier, gameplayKind, bossProfile };
}

function isFinalStageCleared(room) {
  if (!room.stageMap || !room.activeMapNode) return false;
  return room.activeMapNode.depth >= room.stageMap.depth;
}

function getTotalStages(options = {}) {
  return (options.mapDepth || 0) * (options.maxChapters || 0);
}

function getClearedStageCount(room, outcome, options = {}) {
  const mapDepth = options.mapDepth || 0;
  const maxChapters = options.maxChapters || 0;
  const totalStages = getTotalStages({ mapDepth, maxChapters });
  if (outcome === "victory") return totalStages;
  const completedChapters = Math.max(0, Math.min(maxChapters, room.floor - 1)) * mapDepth;
  const currentDepth = Math.max(0, (room.activeMapNode?.depth || 1) - 1);
  return Math.min(totalStages, completedChapters + currentDepth);
}

function getStageMapView(room, options = {}) {
  if (!room.stageMap) return null;
  const mapNodeView = options.mapNodeView || ((node) => node);
  const available = new Set(getAvailableMapNodes(room).map((node) => node.id));
  const mapPath = room.mapPath || [];
  return {
    floor: room.stageMap.floor,
    depth: room.stageMap.depth,
    lanes: room.stageMap.lanes,
    edges: room.stageMap.edges,
    currentNodeId: room.currentMapNodeId,
    pathNodeIds: [...mapPath],
    availableNodeIds: [...available],
    nodes: room.stageMap.nodes.map((node) => ({
      ...mapNodeView(node),
      current: node.id === room.currentMapNodeId,
      available: available.has(node.id),
      completed: mapPath.includes(node.id)
    }))
  };
}

module.exports = {
  applyMapNodeStart,
  countMapVotes,
  ensureMapProgression,
  getAvailableMapNodes,
  getClearedStageCount,
  getMapNodeView,
  getMapNode,
  getNodeGameplayKind,
  getStageMapView,
  getTotalStages,
  isFinalStageCleared,
  pickVoteWinner,
  refreshMapChoices
};
