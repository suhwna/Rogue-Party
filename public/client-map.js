(function () {
  function defaultEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function create(options) {
    const escapeHtml = (options && options.escapeHtml) || defaultEscape;

    function renderChoices(choices, context) {
      return (choices || [])
        .map((choice) => {
          const selected = context.visibleVote === choice.id;
          const pending = !context.serverVote && context.localVoteFresh && context.localMapVote === choice.id;
          const stage = context.getStageNodeMeta(choice);
          const stageLabel = context.formatStageNodeLabel(choice);
          const title = choice.boss ? choice.boss.name : stageLabel;
          const description = choice.boss ? choice.boss.text : context.getStageNodeDescription(choice);
          const actionLabel = selected ? "투표 완료" : pending ? "투표 전송 중" : "이 경로 투표";
          return `
            <button class="choice-button map-choice-button ${stage.kind} ${stage.resolvedKind || ""} ${selected ? "selected" : ""} ${
              pending ? "pending" : ""
            }" type="button" data-node="${choice.id}" ${context.voteLocked ? "disabled" : ""}>
              <span class="map-choice-top">
                <em>${escapeHtml(stageLabel)}</em>
                <b>${choice.votes || 0}V</b>
              </span>
              <strong>${escapeHtml(title)}</strong>
              <span>${escapeHtml(description)}</span>
              <span class="choice-action-row"><span>${escapeHtml(actionLabel)}</span><i class="material-symbols-rounded" aria-hidden="true">${context.voteLocked ? "lock" : "ads_click"}</i></span>
            </button>
          `;
        })
        .join("");
    }

    function renderBoard(stageMap, context) {
      if (!stageMap || !stageMap.nodes) return "";
      const available = new Set(stageMap.availableNodeIds || []);
      const pathNodes = stageMap.pathNodeIds || [];
      const positions = new Map(stageMap.nodes.map((node) => [node.id, context.getMapNodePosition(node, stageMap)]));
      const startPosition = { x: 4, y: 50 };
      const startEdges = stageMap.currentNodeId
        ? []
        : stageMap.nodes
            .filter((node) => node.depth === 1)
            .map((node) => {
              const to = positions.get(node.id);
              return `<path class="map-edge available" d="${context.mapEdgePath(startPosition, to)}"></path>`;
            });
      const edgePaths = (stageMap.edges || [])
        .map(([fromId, toId]) => {
          const from = positions.get(fromId);
          const to = positions.get(toId);
          if (!from || !to) return "";
          const cls = [
            "map-edge",
            context.isMapPathEdge(pathNodes, fromId, toId) ? "completed" : "",
            fromId === stageMap.currentNodeId && available.has(toId) ? "available" : "",
            context.selfVote === toId ? "selected" : ""
          ]
            .filter(Boolean)
            .join(" ");
          return `<path class="${cls}" d="${context.mapEdgePath(from, to)}"></path>`;
        })
        .join("");

      return `
        <div class="map-route">
          <div class="map-terrain" aria-hidden="true"></div>
          <svg class="map-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            ${startEdges.join("")}
            ${edgePaths}
          </svg>
          <div class="map-start ${stageMap.currentNodeId ? "completed" : "available"}" style="left:${startPosition.x}%;top:${startPosition.y}%">
            <strong>S</strong>
            <span>START</span>
          </div>
          ${stageMap.nodes
            .map((node) => {
              const position = positions.get(node.id);
              const style = `left:${position.x}%;top:${position.y}%`;
              const votes = node.votes || 0;
              const stage = context.getStageNodeMeta(node);
              const nodeCaption = node.boss ? node.boss.name : context.formatStageNodeLabel(node);
              const cls = [
                "map-node",
                stage.kind,
                stage.resolvedKind || "",
                node.current ? "current" : "",
                available.has(node.id) ? "available" : "",
                context.selfVote === node.id ? "selected" : "",
                node.completed ? "completed" : ""
              ]
                .filter(Boolean)
                .join(" ");
              return `
                <button class="${cls}" type="button" data-node="${node.id}" style="${style}" ${
                  available.has(node.id) && !context.voteLocked ? "" : "disabled"
                }>
                  <strong>${escapeHtml(context.mapNodeGlyph(node))}</strong>
                  <span>${votes > 0 ? `${votes}V` : node.depth}</span>
                  <small>${escapeHtml(nodeCaption)}</small>
                </button>
              `;
            })
            .join("")}
        </div>
      `;
    }

    return {
      renderChoices,
      renderBoard
    };
  }

  window.RogueMapController = Object.freeze({ create });
})();
