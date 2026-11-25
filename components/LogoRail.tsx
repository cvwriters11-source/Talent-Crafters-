const logos = [
  ["01-mtn.png", "MTN"],
  ["02-vodacom.png", "Vodacom"],
  ["03-jse.png", "JSE"],
  ["04-nedbank.png", "Nedbank"],
  ["05-absa.png", "Absa"],
  ["06-fnb.png", "FNB"],
  ["07-anglo-american.png", "Anglo American"],
  ["08-bhp.png", "BHP"],
  ["09-south32.png", "South32"],
  ["10-gold-fields.png", "Gold Fields"],
  ["11-anglogold.png", "AngloGold Ashanti"],
  ["12-sasol.png", "Sasol"],
  ["13-eskom.png", "Eskom"],
  ["14-telkom.png", "Telkom"],
  ["15-multichoice.png", "MultiChoice"],
  ["16-naspers.png", "Naspers"],
  ["17-discovery.png", "Discovery"],
  ["18-sanlam.png", "Sanlam"],
  ["19-abinbev.png", "AB InBev"],
  ["20-diageo.png", "Diageo"],
  ["21-loreal.png", "L'Oréal"],
  ["22-pepsico.png", "PepsiCo"],
  ["23-colgate.png", "Colgate-Palmolive"],
  ["24-old-mutual.png", "Old Mutual"],
  ["25-microsoft.png", "Microsoft"],
  ["26-ibm.png", "IBM"],
  ["27-amazon.png", "Amazon"],
  ["28-apple.png", "Apple"],
  ["29-oracle.png", "Oracle"],
  ["30-cisco.png", "Cisco"],
  ["31-accenture.png", "Accenture"],
  ["32-deloitte.png", "Deloitte"],
  ["33-kpmg.png", "KPMG"],
  ["34-pwc.png", "PwC"],
  ["35-ey.png", "EY"],
  ["36-sap.png", "SAP"],
  ["37-shell.png", "Shell"],
  ["38-bp.png", "BP"],
  ["39-ge.png", "GE"],
  ["40-siemens.png", "Siemens"],
  ["41-volkswagen.png", "Volkswagen"],
  ["42-bmw.png", "BMW"],
  ["43-astrazeneca.png", "AstraZeneca"],
  ["44-gsk.png", "GSK"],
  ["45-novartis.png", "Novartis"],
  ["46-abbott.png", "Abbott"],
  ["47-roche.png", "Roche"],
  ["48-unilever.png", "Unilever"],
] as const;

export function LogoRail() {
  const loop = [...logos, ...logos];
  return (
    <section className="logo-rail" aria-label="Organisations">
      <h2>Our clients have landed roles at the world&apos;s leading organisations</h2>
      <div className="logo-window">
        <div className="logo-track">
          {loop.map(([file, name], index) => (
            <img key={`${file}-${index}`} className="logo-card" src={`/logos/${file}`} alt={name} />
          ))}
        </div>
      </div>
    </section>
  );
}
