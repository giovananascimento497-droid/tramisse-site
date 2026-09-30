/* ===== DADOS (troque por API/CMS depois) ===== */
const TREE={roupas:{"Partes de cima":["Blusas","Camisas","Regatas","Croppeds","T-shirts","Tops"],"Partes de baixo":["Calças","Saias","Shorts"],"Peças únicas":["Vestidos","Macacões"],"Alfaiataria":["Blazers","Coletes","Conjuntos"],"Outros":["Casacos","Kimonos"]},acessorios:{"Acessórios":["Bolsas","Cintos","Calçados","Bijuterias","Outros acessórios"]}};
const CL={ro:["Rosa","#E8C4BC"],ve:["Verde","#CBD8BE"],of:["Off-white","#F2EEE6"],pr:["Preto","#1E1D1B"],br:["Branco","#FBFAF7"],ma:["Marrom","#4A2E22"],mr:["Marsala","#7A2F2F"],vi:["Vinho","#5A1F2E"],am:["Amarelo manteiga","#F0E3A8"],be:["Beringela","#4B2141"],ac:["Açaí","#5C1F4A"],vm:["Vermelho","#B3202B"],je:["Jeans escuro","#1F2B4A"],jm:["Jeans médio","#5B7396"],jc:["Jeans claro","#9FB5C9"],gf:["Grafite","#3B3936"],li:["Listrado azul","#B9CBE0"],xa:["Xadrez azul","#6F86A8"],xn:["Xadrez marinho","#2C3350"]};
const slug=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const ACC=TREE.acessorios.Acessórios;
/* nome, subcategoria, preço, estilo, variantes cor:tamanhos;..., descrição, flags (N novo, K curadoria, B mais vendida), tecido */
const RAW=[
["Blusa Gola Alta Poá","Blusas",149.9,"Casual","ro:P,M,G","Blusa de gola alta em tecido Rayon Sara, estampa poá.","N","Rayon Sara"],
["Calça Pantalona Alfaiataria","Calças",249.9,"Office","ve:P;ro:M","Calça pantalona em alfaiataria stretch Ciao Sella.","NB","Alfaiataria stretch Ciao Sella"],
["Blusa Guipir Mirage","Blusas",199.9,"Night","ve:P","Blusa de manga longa em guipir Mirage.","NK","Guipir Mirage"],
["Blusa Alças Finas Estampada","Blusas",139.9,"Weekend","ve:P","Blusa de alças finas em silky cristal estampado.","N","Silky cristal"],
["Regata Guipir Mirage","Regatas",149.9,"Night","ro:M","Regata em guipir Mirage.","NB","Guipir Mirage"],
["Blusa Frente Única Twill","Blusas",149.9,"Office","of:G","Blusa frente única em tecido Twill Joy Life.","N","Twill Joy Life"],
["Conjunto Renda Preto","Conjuntos",379.9,"Night","pr:P","Conjunto moderno com detalhe em renda.","NK",""],
["Blusa Degagê","Blusas",129.9,"Weekend","br:M","Blusa degagê com caimento moderno.","N",""],
["Vestido Poá","Vestidos",214.9,"Night","vi:M","Vestido estampado poá.","NB",""],
["Camisa Cropped Listrada","Camisas",109.9,"Casual","ro:M","Camisa em modelagem cropped, punho branco.","N",""],
["Conjunto Saia Xadrez","Conjuntos",209.9,"Casual","xa:P","Conjunto de saia e manga longa em estampa xadrez.","NB",""],
["Regata Amarração Xadrez","Regatas",89.9,"Weekend","xn:M","Regata em modelagem com amarração no pescoço, estampa xadrez.","N",""],
["Camisa Tule Manga Longa","Camisas",120.9,"Casual","ma:P,M","Camisa em modelagem de manga longa em tule.","N","Tule"],
["Vestido Recorte na Cintura","Vestidos",164.9,"Night","vm:P","Vestido com recorte na cintura e detalhe no busto.","NB",""],
["Conjunto Alfaiataria Renda","Conjuntos",249.9,"Office","ma:P","Conjunto em alfaiataria com detalhe de renda no busto.","NK","Alfaiataria"],
["Short Jeans Azul Médio","Shorts",109.9,"Weekend","jm:36,42","Short com lavagem azul média sofisticada e barra desfiada.","N","Jeans"],
["Blusa Sarja Botões","Blusas",104.9,"Casual","ma:P","Blusa marrom em sarja com acabamento em botões.","N","Sarja"],
["Short Marrom Barra Desfiada","Shorts",109.9,"Weekend","ma:36","Short com lavagem marrom sofisticada e barra desfiada.","N","Jeans"],
["Calça Pantalona Jeans Escura","Calças",176.9,"Casual","je:36","Calça pantalona em jeans, lavagem escura e recorte moderno.","NB","Jeans"],
["Calça Jeans Lavagem Média","Calças",179.9,"Casual","jm:40","Calça em jeans com lavagem média e recorte moderno.","N","Jeans"],
["Calça Barrel Jeans Clara","Calças",159.9,"Weekend","jc:44","Calça barrel em jeans com lavagem clara e recorte moderno.","N","Jeans"],
["Calça Wide Leg Listrada","Calças",159.9,"Casual","je:36,40","Calça wide leg em jeans com estampa listrada.","N","Jeans"],
["Conjunto Two Way Marsala","Conjuntos",219.9,"Office","mr:P","Conjunto em tecido Two Way.","NK","Two Way"],
["Conjunto Risca de Giz Vinho","Conjuntos",359.9,"Office","vi:G","Conjunto em alfaiataria risca de giz.","NKB","Alfaiataria risca de giz"],
["Camisa Oversized Algodão","Camisas",159.9,"Casual","am:M,G","Camisa em modelagem oversized, tecido 100% algodão.","NB","100% algodão"],
["Calça Alfaiataria Manteiga","Calças",161.9,"Office","am:M,G","Calça em alfaiataria.","N","Alfaiataria"],
["Blusa New Crepe","Blusas",119.9,"Office","ma:G","Blusa de manga comprida em New Crepe.","N","New Crepe"],
["Conjunto Saia e Blusa Marsala","Conjuntos",239.9,"Office","mr:M,G","Conjunto de saia e blusa em viscose.","NK","Viscose"],
["Conjunto Viscose Beringela","Conjuntos",229.9,"Office","be:M;ma:GG","Conjunto em viscose.","N","Viscose"],
["Calça Risca de Giz","Calças",199.9,"Office","gf:G","Calça de alfaiataria, risca de giz.","N","Alfaiataria"],
["Conjunto Capri Especial","Conjuntos",389.9,"Weekend","li:M","Conjunto em tecido Capri Especial.","NKB","Capri Especial"],
["Conjunto Fluido Vinho","Conjuntos",249.9,"Night","vi:GG","Conjunto de calça e blusa, modelagem fluida.","N",""],
["Macacão Alfaiatado","Macacões",259.9,"Office","ma:P","Macacão alfaiatado.","NKB","Alfaiataria"],
["Conjunto Viscose Açaí","Conjuntos",219.9,"Office","ac:M,G","Conjunto de calça e blusa em viscose.","N","Viscose"],
["Regata Poliamida Premium","Regatas",109.9,"Casual","ma:P,M,G;pr:P,M,G","Regata em poliamida premium.","NB","Poliamida premium"],
["Saia Amarração na Cintura","Saias",164.9,"Weekend","ma:P,M,G","Saia com detalhe de amarração na cintura.","N",""],
["Blusa Liocel","Blusas",109.9,"Weekend","ma:P,M,G","Blusa em liocel.","N","Liocel"],
["Blusa Chiffon","Blusas",89.9,"Night","am:P","Blusa em chiffon.","N","Chiffon"]];
const SO=["PP","P","M","G","GG"],sk=x=>SO.includes(x)?SO.indexOf(x):10+ +x;
const PRODS=RAW.map((r,i)=>{const v=r[4].split(";").flatMap(g=>{const[c,t]=g.split(":");return t.split(",").map(s=>[c,s])}),tam=[...new Set(v.map(x=>x[1]))].sort((a,b)=>sk(a)-sk(b));
return{id:i+1,slug:slug(r[0]),nome:r[0],desc:r[5],det:r[7],preco:r[2],de:0,cat:"roupas",sub:r[1],estilo:r[3],v,cores:[...new Set(v.map(x=>x[0]))],tam,est:Object.fromEntries(tam.map(t=>[t,v.filter(x=>x[1]==t).length*2])),col:"Coleção atual",flags:r[6],tags:[slug(r[1]),r[3].toLowerCase()],img:["assets/products/"+slug(r[0])+".jpg"]}});
const ALLT=[...new Set(PRODS.flatMap(p=>p.tam))].sort((a,b)=>sk(a)-sk(b)),ALLC=[...new Set(PRODS.flatMap(p=>p.cores))];
const sz=(p,c)=>{const t=p.v.filter(x=>x[0]==c).map(x=>x[1]);return t.length==1?t[0]:null};
const TP={"NEW IN":28,"CURADORIA ESPECIAL":24,"ROUPAS":23,"ACESSÓRIOS":"cover","BLUSAS":3,"CALÇAS":22,"VESTIDOS":9,"CONJUNTOS":31,"SAIAS":36,"MACACÕES":33,"CASUAL":25,"OFFICE":30,"NIGHT":7,"WEEKEND":35};
