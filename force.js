function calcLine(a, b) {
  const source = Object.assign({}, a.x < b.x ? a : b);
  const target = Object.assign({}, a.x < b.x ? b : a);
  const w = target.x - source.x;
  const h = target.y - source.y;

  const result = {
    x: source.x,
    y: source.y,
    length: Math.sqrt(w * w + h * h),
    deg: (Math.atan2(h, w) * 360) / (2 * Math.PI),
  };
  return result;
}

const colors = [
  "#D75674",
  "#F15D69",
  "#F16056",
  "#F7774D",
  "#FB8D3D",
  "#FBA52F",
  "#F9BB2B",
  "#F2D324",
  "#D9C81B",
  "#B7BF19",
  "#76BB4C",
  "#00B275",
  "#00A583",
  "#00A39B",
  "#0094A1",
  "#008FB3",
  "#007DAF",
  "#1979BA",
  "#4D73BB",
  "#716BB6",
  "#8B63AC",
  "#9C5DA0",
  "#AB5792",
  "#CC5C87",
];
const darkColors = [
  "#642A2E",
  "#6A2E28",
  "#6F3826",
  "#704020",
  "#704B1A",
  "#6E551B",
  "#6B5E1B",
  "#615C19",
  "#535617",
  "#235418",
  "#185138",
  "#0B4B3C",
  "#004542",
  "#00464C",
  "#004252",
  "#0A3A50",
  "#14344E",
  "#212B4E",
  "#312E4D",
  "#3A2C49",
  "#422944",
  "#512C46",
  "#5D2D3F",
  "#612C37",
];
let stoping = false;
const param = {
  collide: {
    radius: function (d) {
      if (d.open) {
        return 200;
      } else {
        return 60;
      }
    },
    strength: 0.3,
  },
  collision: 20,
  charge: {
    strength: -800,
  },
  force: {
    strength: 0.3,
  },
};
function draw(nodes, links) {
  let stopTimer = false;
  const linkMap = {};
  links.forEach((l) => {
    linkMap[l.source] ??= [];
    linkMap[l.source].push(l.target);
    linkMap[l.target] ??= [];
    linkMap[l.target].push(l.source);
  });
  const link = d3
    .select("main")
    .selectAll("div")
    .data(links)
    .enter()
    .append("div")
    .style("background-color", function (d) {
      return colors[d.target % colors.length];
    });

  const node = d3
    .select("main")
    .selectAll("code")
    .data(nodes)
    .enter()
    .append("code")
    .style("background-color", function (d) {
      return darkColors[d.index % darkColors.length];
    })
    .on("click", function (d) {
      stoping = false;
      d.focus = !d.focus;
      d.open = d.focus;
      linkMap[d.index]?.forEach((t) => {
        nodes[t].open = nodes[t].focus || d.focus;
        if (!nodes[t].open) {
          d.fx = null;
          d.fy = null;
        }
      });
      if (stopTimer) clearTimeout(stopTimer);
      stopTimer = setTimeout(function () {
        if (nodes.some((n) => n.focus)) {
          simulation.stop();
        }
      }, 1500);
      start();
    })
    .call(
      d3
        .drag()
        .on("start", function (d) {
          if (!d3.event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", function (d) {
          d.fx = d3.event.x;
          d.fy = d3.event.y;
        })
        .on("end", function (d) {
          stop();
          //   d.fx = null;
          //   d.fy = null;
        })
    );
  const simulation = d3
    .forceSimulation()
    .velocityDecay(0.8)
    .force(
      "center",
      d3.forceCenter(main.clientWidth / 2, main.clientHeight / 2)
    )
    .force(
      "x",
      d3
        .forceX()
        .x(main.clientWidth / 2)
        .strength(param.force.strength)
    )
    .force(
      "y",
      d3
        .forceY()
        .y(main.clientHeight / 2)
        .strength(param.force.strength)
    )
    .force("link", d3.forceLink())
    .force("charge", d3.forceManyBody().strength(param.charge.strength));

  simulation.nodes(nodes);

  simulation.force("link").links(links);
  start();

  simulation.on("tick", tick);

  function start() {
    if (stoping) return;
    simulation.force("collision", d3.forceCollide(param.collision));
    node
      .text(text)
      .style("border", function (d) {
        if (d.focus) {
          return `5px solid ${colors[d.index % colors.length]}`;
        }
        return null;
      })
      .style("z-index", function (d) {
        return d.open ? 1 : null;
      });

    simulation.force(
      "collide",
      d3
        .forceCollide()
        .radius(param.collide.radius)
        .strength(param.collide.strength)
        .iterations(10)
    );
    simulation.restart();
  }

  function stop() {
    stoping = true;
    simulation.stop();
  }

  function tick() {
    link
      .style("left", function (d) {
        const line = calcLine(d.source, d.target);
        return line.x - line.length / 2 + "px";
      })
      .style("top", function (d) {
        const line = calcLine(d.source, d.target);
        return line.y + "px";
      })
      .style("width", function (d) {
        const line = calcLine(d.source, d.target);
        return `${line.length}px`;
      })
      .style("height", function (d) {
        return `${d.target.focus || d.source.focus ? 5 : 1}px`;
      })
      .style("transform", function (d) {
        const line = calcLine(d.source, d.target);
        return `rotateZ(${line.deg}deg) translate(${line.length / 2}px)`;
      });
    node
      .style("left", function (d) {
        return `${
          d.x - Math.max(...d.label.split(/\n/).map((line) => line.length)) * 3
        }px`;
      })
      .style("top", function (d) {
        return `${d.y - d.label.split(/n/).length * 3}px`;
      });
  }
  function text(d) {
    if (d.open) {
      const label = [d.name];
      d.columns.forEach((column) => {
        label.push(
          `  ${column.name} ${column.type}${column.notNull ? " NOT NULL" : ""}${
            column.autoIncrement ? " AUTO_INCREMENT" : ""
          }${column.default ? " DEFAULT " + column.default : ""}`
        );
      });
      d.label = label.join("\n");
    } else {
      d.label = d.name;
    }
    return d.label;
  }
}
