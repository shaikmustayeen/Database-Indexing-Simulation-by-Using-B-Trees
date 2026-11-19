// B+ Tree Database Indexing Simulator — Order 4 (maximum 3 keys per node)
const ORDER = 4;
const MAX_KEYS = ORDER - 1;
const MIN_LEAF_KEYS = Math.ceil(MAX_KEYS / 2); // 2 for order 4
const MIN_CHILDREN = Math.ceil(ORDER / 2);     // 2 for order 4

class BPlusNode {
  constructor(leaf = false) {
    this.leaf = leaf;
    this.keys = [];
    this.values = [];       // leaf record values
    this.children = [];     // internal child pointers
    this.next = null;       // linked-leaf pointer
    this.parent = null;
    this.id = BPlusNode.nextId++;
  }
}
BPlusNode.nextId = 1;

class BPlusTree {
  constructor() { this.root = new BPlusNode(true); this.lastComparisons = 0; this.events = []; }
  findLeaf(key, counter = { n: 0 }) {
    let node = this.root;
    while (!node.leaf) {
      let i = 0;
      while (i < node.keys.length) {
        counter.n++;
        if (key < node.keys[i]) break;
        i++;
      }
      node = node.children[i];
    }
    return node;
  }
  search(key) {
    const counter = { n: 0 };
    const leaf = this.findLeaf(key, counter);
    for (let i = 0; i < leaf.keys.length; i++) {
      counter.n++;
      if (leaf.keys[i] === key) { this.lastComparisons = counter.n; return leaf.values[i]; }
      if (leaf.keys[i] > key) break;
    }
    this.lastComparisons = counter.n;
    return null;
  }
  insert(key, value) {
    if (!Number.isInteger(key) || key < 1) throw new Error("Student ID must be a positive integer.");
    const leaf = this.findLeaf(key);
    const existing = leaf.keys.indexOf(key);
    if (existing !== -1) { leaf.values[existing] = value; return "updated"; }
    let i = 0;
    while (i < leaf.keys.length && leaf.keys[i] < key) i++;
    leaf.keys.splice(i, 0, key);
    leaf.values.splice(i, 0, value);
    if (leaf.keys.length > MAX_KEYS) this.splitLeaf(leaf);
    this.refreshSeparators();
    return "inserted";
  }
  splitLeaf(leaf) {
    this.events.push({ text: `Leaf node overflowed. Split the sorted keys into two leaf nodes.`, nodeId: leaf.id, type: "split" });
    const right = new BPlusNode(true);
    const split = Math.ceil(leaf.keys.length / 2);
    right.keys = leaf.keys.splice(split);
    right.values = leaf.values.splice(split);
    right.next = leaf.next;
    leaf.next = right;
    this.insertRightSibling(leaf, right);
    this.events.push({ text: `A new leaf node was created and linked to the next leaf.`, nodeId: right.id, type: "split" });
  }
  insertRightSibling(left, right) {
    if (!left.parent) {
      const newRoot = new BPlusNode(false);
      newRoot.children = [left, right];
      left.parent = newRoot; right.parent = newRoot;
      this.root = newRoot;
      return;
    }
    const parent = left.parent;
    const index = parent.children.indexOf(left);
    parent.children.splice(index + 1, 0, right);
    right.parent = parent;
    if (parent.children.length > ORDER) this.splitInternal(parent);
  }
  splitInternal(node) {
    this.events.push({ text: `Internal node overflowed. Divide its child pointers between two internal nodes.`, nodeId: node.id, type: "split" });
    const right = new BPlusNode(false);
    const split = Math.ceil(node.children.length / 2);
    right.children = node.children.splice(split);
    right.children.forEach(child => child.parent = right);
    this.insertRightSibling(node, right);
    this.events.push({ text: `The new internal sibling was attached to the parent.`, nodeId: right.id, type: "split" });
  }
  refreshSeparators(node = this.root) {
    if (node.leaf) return node.keys[0] ?? null;
    node.keys = [];
    for (let i = 0; i < node.children.length; i++) {
      const min = this.refreshSeparators(node.children[i]);
      if (i > 0) node.keys.push(min);
    }
    return this.minimum(node);
  }
  minimum(node) {
    while (node && !node.leaf) node = node.children[0];
    return node?.keys[0] ?? null;
  }
  delete(key) {
    const leaf = this.findLeaf(key);
    const index = leaf.keys.indexOf(key);
    if (index === -1) return false;
    leaf.keys.splice(index, 1);
    leaf.values.splice(index, 1);
    if (leaf === this.root) return true;
    if (leaf.keys.length < MIN_LEAF_KEYS) this.rebalanceLeaf(leaf);
    this.refreshSeparators();
    return true;
  }
  rebalanceLeaf(leaf) {
    const parent = leaf.parent;
    const idx = parent.children.indexOf(leaf);
    const left = idx > 0 ? parent.children[idx - 1] : null;
    const right = idx < parent.children.length - 1 ? parent.children[idx + 1] : null;
    if (left && left.keys.length > MIN_LEAF_KEYS) {
      leaf.keys.unshift(left.keys.pop()); leaf.values.unshift(left.values.pop());
      this.events.push({ text: `Borrowed the largest key from the left leaf to restore minimum occupancy.`, nodeId: leaf.id, type: "borrow" });
      return;
    }
    if (right && right.keys.length > MIN_LEAF_KEYS) {
      leaf.keys.push(right.keys.shift()); leaf.values.push(right.values.shift());
      this.events.push({ text: `Borrowed the smallest key from the right leaf to restore minimum occupancy.`, nodeId: leaf.id, type: "borrow" });
      return;
    }
    if (left) {
      left.keys.push(...leaf.keys); left.values.push(...leaf.values); left.next = leaf.next;
      parent.children.splice(idx, 1);
      this.events.push({ text: `Merged this leaf with its left sibling and updated the leaf link.`, nodeId: left.id, type: "merge" });
    } else if (right) {
      leaf.keys.push(...right.keys); leaf.values.push(...right.values); leaf.next = right.next;
      parent.children.splice(idx + 1, 1);
      this.events.push({ text: `Merged the right leaf into this leaf and updated the leaf link.`, nodeId: leaf.id, type: "merge" });
    }
    this.rebalanceInternal(parent);
  }
  rebalanceInternal(node) {
    if (node === this.root) {
      if (!node.leaf && node.children.length === 1) {
        this.root = node.children[0]; this.root.parent = null;
        this.events.push({ text: `The old root had one child, so the tree height decreased by one.`, nodeId: this.root.id, type: "root" });
      }
      return;
    }
    if (node.children.length >= MIN_CHILDREN) return;
    const parent = node.parent;
    const idx = parent.children.indexOf(node);
    const left = idx > 0 ? parent.children[idx - 1] : null;
    const right = idx < parent.children.length - 1 ? parent.children[idx + 1] : null;
    if (left && left.children.length > MIN_CHILDREN) {
      const moved = left.children.pop();
      node.children.unshift(moved); moved.parent = node;
      this.events.push({ text: `Borrowed a child pointer from the left internal sibling.`, nodeId: node.id, type: "borrow" });
      this.refreshSeparators();
      return;
    }
    if (right && right.children.length > MIN_CHILDREN) {
      const moved = right.children.shift();
      node.children.push(moved); moved.parent = node;
      this.events.push({ text: `Borrowed a child pointer from the right internal sibling.`, nodeId: node.id, type: "borrow" });
      this.refreshSeparators();
      return;
    }
    if (left) {
      left.children.push(...node.children);
      node.children.forEach(child => child.parent = left);
      parent.children.splice(idx, 1);
      this.events.push({ text: `Merged this internal node with its left sibling.`, nodeId: left.id, type: "merge" });
    } else if (right) {
      node.children.push(...right.children);
      right.children.forEach(child => child.parent = node);
      parent.children.splice(idx + 1, 1);
      this.events.push({ text: `Merged the right internal sibling into this node.`, nodeId: node.id, type: "merge" });
    }
    this.rebalanceInternal(parent);
  }
  getAll() {
    let leaf = this.root;
    while (!leaf.leaf) leaf = leaf.children[0];
    const out = [];
    while (leaf) { leaf.keys.forEach((k, i) => out.push(leaf.values[i])); leaf = leaf.next; }
    return out;
  }
  getLeaves() {
    let leaf = this.root;
    while (!leaf.leaf) leaf = leaf.children[0];
    const out = [];
    while (leaf) { out.push(leaf); leaf = leaf.next; }
    return out;
  }
  height() { let h = 1, n = this.root; while (!n.leaf) { h++; n = n.children[0]; } return h; }
  nodeCount(node = this.root) { return node.leaf ? 1 : 1 + node.children.reduce((s,c)=>s+this.nodeCount(c),0); }
  range(from, to) {
    const out = [];
    let leaf = this.findLeaf(from);
    while (leaf) {
      for (let i=0;i<leaf.keys.length;i++) {
        if (leaf.keys[i] > to) return out;
        if (leaf.keys[i] >= from) out.push(leaf.values[i]);
      }
      leaf = leaf.next;
    }
    return out;
  }
}

const STORAGE_KEY = "indexlab_bplus_records_v1";
let tree = new BPlusTree();
let operations = 0;
let lastBenchmark = null;
let toastTimer;

const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function notify(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2300);
}
function message(text, type="") { const el=$("operationMessage"); el.textContent=text; el.className="message "+type; }
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tree.getAll())); }
function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(saved)) saved.forEach(r => tree.insert(Number(r.id), r));
    else seedData();
  } catch { localStorage.removeItem(STORAGE_KEY); seedData(); }
}
function seedData() {
  const demo = [
    [101,"Aarav Sharma","Computer Science"],[105,"Ayesha Khan","Data Science"],
    [108,"Rohan Reddy","Information Technology"],[112,"Meera Patel","Data Science"],
    [116,"Ishaan Verma","Electronics"],[120,"Sara Ahmed","Computer Science"],
    [124,"Kiran Kumar","Mechanical"],[129,"Diya Rao","Data Science"],
    [133,"Arjun Singh","Information Technology"],[138,"Ananya Das","Computer Science"],
    [142,"Kabir Ali","Electronics"],[147,"Priya Nair","Data Science"]
  ];
  demo.forEach(([id,name,department])=>tree.insert(id,{id,name,department}));
  persist();
}
function refresh() {
  const records=tree.getAll(), leaves=tree.getLeaves();
  $("statRecords").textContent=records.length;
  $("statHeight").textContent=tree.height();
  $("statLeaves").textContent=leaves.length;
  $("statOps").textContent=operations;
  $("recordCountPill").textContent=records.length+" records";
  renderRecent(records); renderRecords(); drawTree(); updatePerformanceEmpty();
}
function renderRecent(records) {
  const rows=records.slice(-5).reverse();
  $("recentRows").innerHTML=rows.length?rows.map(r=>`<tr><td>${r.id}</td><td>${escapeHTML(r.name)}</td><td>${escapeHTML(r.department)}</td><td><span class="status-label">Indexed</span></td></tr>`).join(""):`<tr><td colspan="4" class="empty">No records available.</td></tr>`;
}
function renderRecords() {
  const filter=($("recordFilter")?.value||"").toLowerCase();
  const records=tree.getAll().filter(r=>String(r.id).includes(filter)||r.name.toLowerCase().includes(filter)||r.department.toLowerCase().includes(filter));
  $("recordRows").innerHTML=records.length?records.map(r=>`<tr><td>${r.id}</td><td>${escapeHTML(r.name)}</td><td>${escapeHTML(r.department)}</td><td><button class="action-btn" data-edit="${r.id}">Edit</button><button class="action-btn delete" data-delete="${r.id}">Delete</button></td></tr>`).join(""):`<tr><td colspan="4" class="empty">No matching records.</td></tr>`;
  $("tableFoot").textContent=`Showing ${records.length} of ${tree.getAll().length} records · Stored in this browser`;
}
function drawTree(highlightIds = []) {
  const svg=$("treeSvg"); const NS="http://www.w3.org/2000/svg";
  while(svg.firstChild) svg.removeChild(svg.firstChild);
  const root=tree.root, levels=[];
  function collect(node,depth=0){(levels[depth]??=[]).push(node);if(!node.leaf)node.children.forEach(c=>collect(c,depth+1));}
  collect(root);
  const leafNodes=tree.getLeaves(), leafY=90+(levels.length-1)*112;
  const positions=new Map(), width=Math.max(720,leafNodes.length*145+80), height=Math.max(260,levels.length*112+90);
  svg.setAttribute("viewBox",`0 0 ${width} ${height}`);svg.style.height=height+"px";svg.style.minWidth=width+"px";
  const leafGap=width/(leafNodes.length+1);
  leafNodes.forEach((leaf,i)=>positions.set(leaf,{x:leafGap*(i+1),y:leafY}));
  for(let d=levels.length-2;d>=0;d--){
    levels[d].forEach(node=>{
      const childPos=node.children.map(c=>positions.get(c));
      positions.set(node,{x:childPos.reduce((s,p)=>s+p.x,0)/childPos.length,y:90+d*112});
    });
  }
  function line(x1,y1,x2,y2,color="#b9c7dc",dash=""){const el=document.createElementNS(NS,"line");Object.entries({x1,y1,x2,y2,stroke:color,"stroke-width":1.7,"stroke-dasharray":dash}).forEach(([k,v])=>el.setAttribute(k,v));svg.appendChild(el);}
  function rect(x,y,w,h,fill,stroke,rx=8){const el=document.createElementNS(NS,"rect");Object.entries({x,y,width:w,height:h,fill,stroke,"stroke-width":1.4,rx}).forEach(([k,v])=>el.setAttribute(k,v));svg.appendChild(el);}
  function txt(x,y,value,fill="#34445c",size=12,weight="600"){const el=document.createElementNS(NS,"text");Object.entries({x,y,fill,"font-size":size,"font-family":"DM Sans, sans-serif","font-weight":weight,"text-anchor":"middle"}).forEach(([k,v])=>el.setAttribute(k,v));el.textContent=value;svg.appendChild(el);}
  // Parent-child connectors
  for(const level of levels){level.forEach(node=>{if(!node.leaf){const p=positions.get(node);node.children.forEach(c=>{const q=positions.get(c);line(p.x,p.y+23,q.x,q.y-22);});}});}
  // Nodes
  levels.forEach((level,d)=>level.forEach(node=>{
    const p=positions.get(node),w=Math.max(76,node.keys.length*39+18),h=43;
    const isHighlighted = highlightIds.includes(node.id);
    rect(p.x-w/2,p.y-h/2,w,h,node.leaf?"#e9f8f1":"#edf2ff",isHighlighted?"#f0a43a":(node.leaf?"#9bd9bd":"#b6caff"));
    if(isHighlighted){ const mark=svg.lastChild; mark.setAttribute("class","node-highlight"); mark.setAttribute("stroke-width","3"); }
    if(node.keys.length===0) txt(p.x,p.y+4,"empty","#8290a3",11);
    else {
      const cell=w/node.keys.length;
      node.keys.forEach((k,i)=>{if(i>0)line(p.x-w/2+i*cell,p.y-h/2+5,p.x-w/2+i*cell,p.y+h/2-5,node.leaf?"#b5e5cd":"#cfdbf6");txt(p.x-w/2+cell*(i+.5),p.y+4,String(k),node.leaf?"#16845e":"#315fc7",12,"700");});
    }
    txt(p.x,p.y-31,node.leaf?"LEAF":"INTERNAL","#94a0b0",8,"700");
  }));
  // Leaf-link arrows
  for(let i=0;i<leafNodes.length-1;i++){const a=positions.get(leafNodes[i]),b=positions.get(leafNodes[i+1]);line(a.x+43,a.y+31,b.x-43,b.y+31,"#22a879","4 3");}
  if(root.leaf && root.keys.length===0) txt(width/2,35,"Insert records to build the B+ Tree","#9aa5b3",12,"500");
}
let animationSteps = [];
let animationIndex = 0;
let animationTimer = null;
function stopAnimation() { if (animationTimer) clearInterval(animationTimer); animationTimer = null; $("playStepsBtn").textContent = "▶ Play"; }
function showAnimationStep() {
  if (!animationSteps.length) return;
  const step = animationSteps[animationIndex];
  $("stepCounter").textContent = `Step ${animationIndex + 1} of ${animationSteps.length}`;
  $("stepDescription").textContent = step.text;
  $("stepType").textContent = step.label || "Operation";
  $("stepType").className = "step-type " + (step.type || "operation");
  drawTree(step.nodeId ? [step.nodeId] : []);
  $("prevStepBtn").disabled = animationIndex === 0;
  $("nextStepBtn").disabled = animationIndex === animationSteps.length - 1;
}
function playAnimation(steps) {
  stopAnimation();
  animationSteps = steps.length ? steps : [{ text: "Operation completed. The B+ Tree remains balanced and all leaf keys stay sorted.", label: "Complete", type: "operation" }];
  animationIndex = 0;
  navigate("visualizer");
  showAnimationStep();
}
function addStep(text, label="Operation", type="operation", nodeId=null) { animationSteps.push({ text, label, type, nodeId }); }
$("prevStepBtn").addEventListener("click", () => { stopAnimation(); if(animationIndex>0){animationIndex--;showAnimationStep();} });
$("nextStepBtn").addEventListener("click", () => { stopAnimation(); if(animationIndex<animationSteps.length-1){animationIndex++;showAnimationStep();} });
$("playStepsBtn").addEventListener("click", () => {
  if(animationTimer){stopAnimation();return;}
  if(!animationSteps.length)return;
  if(animationIndex>=animationSteps.length-1)animationIndex=0;
  $("playStepsBtn").textContent="Ⅱ Pause";
  animationTimer=setInterval(()=>{ if(animationIndex<animationSteps.length-1){animationIndex++;showAnimationStep();}else stopAnimation(); },1200);
  showAnimationStep();
});

function updatePerformanceEmpty() {
  if(!lastBenchmark){["linearCount","treeCount","savedCount","gainCount","linearLabel","treeLabel"].forEach(id=>$(id).textContent="—");$("linearBar").style.width="0%";$("treeBar").style.width="0%";}
}
function runBenchmark(key) {
  const records=tree.getAll();let linear=0,found=false;
  for(const r of records){linear++;if(r.id===key){found=true;break;}}
  const result=tree.search(key),btree=tree.lastComparisons;
  const saved=Math.max(0,linear-btree),gain=linear?Math.round((saved/linear)*100):0;
  lastBenchmark={linear,btree,saved,gain,found};
  $("linearCount").textContent=linear;$("treeCount").textContent=btree;$("savedCount").textContent=saved;$("gainCount").textContent=gain+"%";
  $("linearLabel").textContent=linear+" comparisons";$("treeLabel").textContent=btree+" comparisons";
  const max=Math.max(linear,btree,1);$("linearBar").style.width=(linear/max*100)+"%";$("treeBar").style.width=(btree/max*100)+"%";
  return result;
}
function navigate(view) {
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===view+"-view"));
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  const titles={dashboard:"Dashboard",records:"Records",visualizer:"Tree Visualizer",performance:"Performance"};
  $("page-title").textContent=titles[view]||"Dashboard";
  if(view==="visualizer")drawTree();
}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.goto)));

$("insertForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=Number($("studentId").value),name=$("studentName").value.trim(),department=$("studentDept").value.trim();
  if(!Number.isInteger(id)||id<1||!name||!department){message("Please enter a valid ID, name and department.","error");return;}
  try{
    tree.events=[];
    const status=tree.insert(id,{id,name,department});
    const steps=[{text:`Start at the root and follow separator keys to the correct leaf for Student ID ${id}.`,label:"Locate leaf",type:"operation"},{text:`Insert ${id} in sorted order inside the target leaf node.`,label:"Insert key",type:"operation"},...tree.events.map(ev=>({text:ev.text,label:ev.type.toUpperCase(),type:ev.type,nodeId:ev.nodeId})),{text:"Update separator keys. All records remain sorted and leaf nodes remain linked.",label:"Complete",type:"operation"}];
    operations++;persist();refresh();playAnimation(steps);
    message(status==="updated"?`Record ${id} already existed. Its details were updated.`:`Record ${id} inserted successfully into the B+ Tree.`,"success");
    $("insertForm").reset();notify(status==="updated"?"Record updated":"Record inserted");
  }catch(err){message(err.message,"error");}
});
$("searchBtn").addEventListener("click",()=>{
  const id=Number($("searchId").value);if(!Number.isInteger(id)||id<1){message("Enter a valid Student ID to search.","error");return;}
  const path=[];let cursor=tree.root;while(cursor){path.push(cursor.id);if(cursor.leaf)break;let j=0;while(j<cursor.keys.length&&id>=cursor.keys[j])j++;cursor=cursor.children[j];}
  const result=tree.search(id);operations++;refresh();
  playAnimation([{text:`Begin at the root and compare ${id} with the separator keys.`,label:"Start at root",type:"operation",nodeId:path[0]},...path.slice(1).map((nodeId,i)=>({text:i===path.length-2?`Reach the target leaf and scan its sorted keys for ${id}.`:`Follow the selected child pointer toward the correct leaf.`,label:i===path.length-2?"Inspect leaf":"Follow pointer",type:"operation",nodeId})),{text:result?`Student ID ${id} was found. The leaf contains the matching record.`:`Student ID ${id} is not present in the target leaf.`,label:result?"Found":"Not found",type:"operation",nodeId:path[path.length-1]}]);
  message(result?`Found: ${result.name} · ${result.department} · ${tree.lastComparisons} key comparisons.`:`Student ID ${id} was not found in the index. · ${tree.lastComparisons} key comparisons.`,result?"success":"error");
});
$("searchId").addEventListener("keydown",e=>{if(e.key==="Enter")$("searchBtn").click();});
$("recordFilter").addEventListener("input",renderRecords);
$("recordRows").addEventListener("click",e=>{
  const del=e.target.dataset.delete,edit=e.target.dataset.edit;
  if(del){
    const id=Number(del);if(confirm(`Delete student record ${id}?`)){tree.events=[];const existed=tree.delete(id);const steps=[{text:`Locate Student ID ${id} by following the separator keys from the root.`,label:"Locate record",type:"operation"},{text:`Remove ${id} from its leaf node.`,label:"Delete key",type:"operation"},...tree.events.map(ev=>({text:ev.text,label:ev.type.toUpperCase(),type:ev.type,nodeId:ev.nodeId})),{text:"Refresh separator keys. The B+ Tree is balanced after deletion.",label:"Complete",type:"operation"}];operations++;persist();refresh();playAnimation(steps);notify(existed?"Record deleted":"Record not found");}
  }
  if(edit){
    const id=Number(edit),r=tree.search(id);if(!r)return;
    const name=prompt("Update student name:",r.name);if(name===null)return;
    const department=prompt("Update department:",r.department);if(department===null)return;
    if(!name.trim()||!department.trim()){notify("Name and department cannot be empty");return;}
    tree.insert(id,{id,name:name.trim(),department:department.trim()});operations++;persist();refresh();notify("Record updated");
  }
});
$("rangeBtn").addEventListener("click",()=>{
  const from=Number($("rangeFrom").value),to=Number($("rangeTo").value);
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<1||to<from){$("rangeResults").textContent="Enter a valid range (To ID must be greater than or equal to From ID).";return;}
  const results=tree.range(from,to);operations++;refresh();
  $("rangeResults").innerHTML=results.length?`<b>${results.length} matching record(s):</b><br>${results.map(r=>`${r.id} — ${escapeHTML(r.name)} (${escapeHTML(r.department)})`).join("<br>")}`:"No records found in this range.";
});
$("benchmarkBtn").addEventListener("click",()=>{
  const id=Number($("benchmarkId").value);if(!Number.isInteger(id)||id<1){notify("Enter a valid Student ID");return;}
  runBenchmark(id);operations++;refresh();notify(lastBenchmark.found?"Benchmark completed: record found":"Benchmark completed: record not found");
});
$("exportBtn").addEventListener("click",()=>{
  const rows=[["Student ID","Name","Department"],...tree.getAll().map(r=>[r.id,r.name,r.department])];
  const csv=rows.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="bplus_tree_student_records.csv";a.click();URL.revokeObjectURL(url);
});
$("resetBtn").addEventListener("click",()=>{
  if(!confirm("Reset all records and restore the sample dataset?"))return;
  tree=new BPlusTree();operations=0;lastBenchmark=null;seedData();refresh();message("Demo records restored. Ready for new operations.");notify("Demo data reset");
});
$("fitTreeBtn").addEventListener("click",()=>{drawTree();$("treeSvg").scrollIntoView({behavior:"smooth",block:"center"});});
loadData();refresh();
