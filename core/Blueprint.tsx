/** Original orbital diagram. Decorative only; never intercepts catalogue interactions. */
export default function Blueprint(){
 return <div className="blueprint" aria-hidden="true"><div className="blueprint-grid"/>
  <svg className="blueprint-orbit" viewBox="0 0 900 900" fill="none">
   <defs><linearGradient id="orbit-light" x1="100" y1="0" x2="750" y2="800"><stop stopColor="#72f5b5" stopOpacity=".5"/><stop offset=".5" stopColor="#72f5b5" stopOpacity=".04"/><stop offset="1" stopColor="#dfce96" stopOpacity=".35"/></linearGradient></defs>
   <g stroke="url(#orbit-light)"><circle cx="450" cy="450" r="360"/><circle cx="450" cy="450" r="310" strokeDasharray="2 12"/><circle cx="450" cy="450" r="265"/><ellipse cx="450" cy="450" rx="375" ry="155" transform="rotate(-34 450 450)"/><ellipse cx="450" cy="450" rx="375" ry="155" transform="rotate(44 450 450)"/>
    <path d="M0 450h185m530 0h185M450 0v185m0 530v185M195 195l68 68m374 374 68 68M195 705l68-68m374-374 68-68"/>
    <path d="M30 300h110l80-80h115M565 680h115l80-80h110M110 540h70l50 50M660 310l50-50h90"/>
   </g>
   <g stroke="#8ab99e" opacity=".3">{Array.from({length:60},(_,i)=><path key={i} d="M450 74v8" transform={`rotate(${i*6} 450 450)`}/>)}</g>
   <g fill="#9af3c0">{[[450,90],[810,450],[450,810],[90,450],[220,220],[680,680]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="4"/><circle cx={x} cy={y} r="10" fill="none" stroke="#9af3c0" strokeOpacity=".3"/></g>)}</g>
  </svg><div className="blueprint-grain"/>
 </div>;
}
