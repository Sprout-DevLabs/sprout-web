# Regenerates src/data/graph.json: run from a clone of pallets/click at
# 2247b35 with sprout on PATH:  python3 path/to/click-graph.py out.json
# pallets/click as a map: source files laid out by force in the middle,
# tests on a ring around them, each near the source files it imports.
import json, subprocess, random, math, sys
files = [f for f in subprocess.check_output(['git','ls-files','src/click/*.py','tests/*.py']).decode().split()
         if not f.startswith('tests/typing') and not (f.startswith('tests/') and f.endswith('__init__.py'))]
idx = {f:i for i,f in enumerate(files)}
edges = sorted({(idx[f], idx[r['path']]) for f in files
                for r in json.loads(subprocess.check_output(['sprout','deps',f,'--json']))['results'] if r['path'] in idx})
n=len(files); test=[f.startswith('tests/') for f in files]
src=[i for i in range(n) if not test[i]]
random.seed(3); pos={i:[random.uniform(-1,1),random.uniform(-1,1)] for i in src}
for it in range(1500):
    t=0.05*(1-it/1500)+0.002; d={i:[0,0] for i in src}
    for a in src:
        for b in src:
            if a<b:
                dx=(pos[a][0]-pos[b][0]); dy=(pos[a][1]-pos[b][1])*1.8   # labels are wide: keep rows apart
                r2=dx*dx+dy*dy+1e-4; f=0.02/r2
                d[a][0]+=dx*f; d[a][1]+=dy*f; d[b][0]-=dx*f; d[b][1]-=dy*f
    for a,b in edges:
        if test[a] or test[b]: continue
        dx=pos[a][0]-pos[b][0]; dy=pos[a][1]-pos[b][1]; r=math.hypot(dx,dy)+1e-6; f=(r-0.4)*0.03
        d[a][0]-=dx/r*f; d[a][1]-=dy/r*f; d[b][0]+=dx/r*f; d[b][1]+=dy/r*f
    for i in src:
        d[i][0]-=pos[i][0]*0.01; d[i][1]-=pos[i][1]*0.01
        m=math.hypot(*d[i]); s=min(m,t)/(m+1e-9); pos[i][0]+=d[i][0]*s; pos[i][1]+=d[i][1]*s
xs=[pos[i][0] for i in src]; ys=[pos[i][1] for i in src]
cx,cy,RX,RY=470,280,250,150   # labels sit right of their dot, so the cluster sits a little left
xy={}
for i in src:
    xy[i]=(cx-RX+(pos[i][0]-min(xs))/(max(xs)-min(xs))*2*RX, cy-RY+(pos[i][1]-min(ys))/(max(ys)-min(ys))*2*RY)
# tests: ordered round the ring by the direction of what they import
tests=[i for i in range(n) if test[i]]
def ang(i):
    nb=[xy[b] for a,b in edges if a==i and b in xy] or [(cx,cy)]
    mx=sum(p[0] for p in nb)/len(nb); my=sum(p[1] for p in nb)/len(nb)
    return math.atan2(my-cy+1e-3*i, mx-cx)
tests.sort(key=ang)
for k,i in enumerate(tests):
    a=-math.pi/2+2*math.pi*k/len(tests)
    xy[i]=(500+460*math.cos(a), 280+250*math.sin(a))
nodes=[{'f':f,'x':round(xy[i][0]),'y':round(xy[i][1])} for i,f in enumerate(files)]
json.dump({'nodes':nodes,'edges':edges}, open(sys.argv[1],'w'), separators=(',',':'))
print(n, len(edges))
