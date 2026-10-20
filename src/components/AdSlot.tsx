export function AdSlot({enabled,client,slot}:{enabled:boolean;client:string;slot:string}) {
 if(!enabled || !client || !slot) return null;
 return <div style={{margin:"18px auto",minHeight:90,display:"grid",placeItems:"center",border:"1px dashed var(--line)",borderRadius:12,color:"var(--muted)",fontSize:12}}>
   <span>विज्ञापन स्थान · AdSense कॉन्फ़िगरेशन के बाद दिखेगा ({slot})</span>
 </div>;
}