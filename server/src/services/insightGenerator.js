const { v4: uuidv4 } = require('uuid');

/**
 * Generates "nedopalky" (hidden gems / overlooked insights) based on data analysis.
 * Top 3 insights per stock, refreshed with latest data.
 */
class InsightGenerator {
  constructor(db) {
    this.db = db;
  }

  generateForTicker(ticker, stock) {
    const insights = [];
    const now = new Date().toISOString();

    // 1. Analyze insider activity
    const insiderInsight = this._analyzeInsiderActivity(ticker, stock);
    if (insiderInsight) insights.push(insiderInsight);

    // 2. Analyze news sentiment/volume
    const newsInsight = this._analyzeNewsVolume(ticker, stock);
    if (newsInsight) insights.push(newsInsight);

    // 3. Sector-specific insight
    const sectorInsight = this._generateSectorInsight(ticker, stock);
    if (sectorInsight) insights.push(sectorInsight);

    // 4. Institutional activity
    const instInsight = this._analyzeInstitutionalActivity(ticker, stock);
    if (instInsight) insights.push(instInsight);

    // Take top 3 by importance
    return insights
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 3)
      .map(i => ({
        ...i,
        id: `insight-${ticker}-${i.category}-${Date.now()}`,
        ticker,
        created_at: now,
        updated_at: now,
      }));
  }

  _analyzeInsiderActivity(ticker, stock) {
    const insiders = this.db.getInsidersByTicker(ticker, 20);
    if (!insiders || insiders.length === 0) {
      return {
        title: 'Žádná recentní insider aktivita',
        description: `U ${stock.company_name} (${ticker}) nebyla zaznamenána žádná insider transakce v posledních týdnech. Absence insider obchodů může znamenat stabilitu, ale také nejistotu vedení.`,
        context: 'Insider transakce jsou jedním z nejspolehlivějších indikátorů důvěry vedení ve firmu. Sledování insider aktivity může odhalit příležitosti dříve než veřejné zprávy.',
        retail_meaning: 'Pokud insideři nekupují ani neprodávají, neexistuje jasný signál od vedení. Zaměřte se na fundamentální analýzu a nadcházející katalyzátory.',
        category: 'insider',
        sources: 'Finnhub Insider Transactions, SEC EDGAR Form 4',
        importance: 2,
      };
    }

    const buys = insiders.filter(i => i.transaction_type === 'buy');
    const sells = insiders.filter(i => i.transaction_type === 'sell');
    const buyValue = buys.reduce((sum, i) => sum + (i.total_value || 0), 0);
    const sellValue = sells.reduce((sum, i) => sum + (i.total_value || 0), 0);

    if (buys.length > sells.length && buyValue > 0) {
      return {
        title: `Insideři nakupují – ${buys.length} nákupů vs ${sells.length} prodejů`,
        description: `Vedení ${stock.company_name} provádí více nákupů ($${(buyValue/1000).toFixed(0)}K) než prodejů ($${(sellValue/1000).toFixed(0)}K). Insider nákupy za vlastní peníze jsou historicky jedním z nejsilnějších bullish signálů.`,
        context: `Akademické studie (např. Lakonishok & Lee, 2001) ukazují, že akcie s vysokou insider buying aktivitou překonávají trh o 7-10% ročně. Nákupy vedení signalizují, že ti, kdo znají firmu nejlépe, věří v její budoucnost.`,
        retail_meaning: 'Pozitivní signál! Insideři kupující za vlastní peníze mají "skin in the game". Zvažte bližší průzkum fundamentů firmy.',
        category: 'insider',
        sources: 'Finnhub Insider Transactions, SEC EDGAR',
        importance: 4,
      };
    }

    if (sells.length > buys.length * 2 && sellValue > 100000) {
      return {
        title: `Zvýšené insider prodeje – ${sells.length} prodejů za $${(sellValue/1000).toFixed(0)}K`,
        description: `U ${stock.company_name} zaznamenáváme zvýšenou aktivitu insider prodejů. Je třeba rozlišit plánované prodeje (Rule 10b5-1) od neočekávaných prodejů.`,
        context: 'Insider prodeje jsou méně spolehlivý signál než nákupy, protože insideři prodávají z mnoha důvodů (daně, diverzifikace, plánované prodeje). Nicméně masivní a neočekávané prodeje mohou signalizovat obavy.',
        retail_meaning: 'Buďte obezřetní, ale nepanikařte. Zkontrolujte, zda jde o plánované prodeje nebo reakci na nějakou událost.',
        category: 'insider',
        sources: 'Finnhub Insider Transactions, SEC EDGAR',
        importance: 3,
      };
    }

    return {
      title: `Vyvážená insider aktivita – ${buys.length} nákupů, ${sells.length} prodejů`,
      description: `Insider transakce u ${stock.company_name} jsou vyvážené bez jasného trendu. Nákupy: $${(buyValue/1000).toFixed(0)}K, Prodeje: $${(sellValue/1000).toFixed(0)}K.`,
      context: 'Vyvážená insider aktivita je neutrální signál. Sledujte případné změny v trendu - náhlý nárůst nákupů nebo prodejů může předznamenávat důležitou událost.',
      retail_meaning: 'Neutrální signál od insiderů. Rozhodování založte na dalších faktorech - fundamentech, katalyzátorech a technické analýze.',
      category: 'insider',
      sources: 'Finnhub Insider Transactions',
      importance: 2,
    };
  }

  _analyzeNewsVolume(ticker, stock) {
    const summary = this.db.getStockSummary(ticker);
    
    if (summary.recent_news_24h > 5) {
      return {
        title: `Vysoký objem zpráv – ${summary.recent_news_24h} za posledních 24h`,
        description: `${stock.company_name} má výrazně zvýšený objem zpráv. To může indikovat blížící se katalyzátor, earnings call, nebo významnou korporátní událost.`,
        context: 'Zvýšený mediální zájem často předchází nebo doprovází výrazný cenový pohyb. Nemusí to znamenat pozitivní nebo negativní směr, ale zvýšenou volatilitu.',
        retail_meaning: 'Zvýšený objem zpráv = zvýšená volatilita. Zkontrolujte, co je za zprávami, a přizpůsobte svou pozici zvýšenému riziku.',
        category: 'sentiment',
        sources: `Finnhub, Yahoo Finance, Google News (${summary.recent_news_24h} zpráv za 24h)`,
        importance: 3,
      };
    }

    if (summary.total_news === 0) {
      return {
        title: 'Minimální mediální pokrytí',
        description: `${stock.company_name} (${ticker}) má velmi nízké mediální pokrytí. To může znamenat, že jde o podhodnocenou příležitost, kterou analytici přehlížejí.`,
        context: 'Akcie s nízkým mediálním pokrytím ("under the radar") mohou být nesprávně oceněné, protože je méně analytiků a institucí sleduje. To vytváří příležitosti pro informované retailové investory.',
        retail_meaning: 'Nízké pokrytí = potenciální příležitost, ale i vyšší riziko. Proveďte vlastní due diligence, protože méně očí znamená méně kontrol.',
        category: 'sentiment',
        sources: 'Analýza pokrytí z více zdrojů',
        importance: 2,
      };
    }

    return null;
  }

  _generateSectorInsight(ticker, stock) {
    const sectorInsights = {
      energy: {
        title: 'Energetický sektor – klíčové faktory',
        description: `${stock.company_name} je ovlivněna cenou ropy, geopolitikou a přechodem na obnovitelné zdroje. Offshore drilling firmy těží z nedostatečných investic do nových vrtů v posledních letech.`,
        context: 'Globální poptávka po ropě zůstává silná navzdory energetickému přechodu. Nedostatečné capex investice v uplynulých letech vedou k omezenější nabídce, což tlačí ceny nahoru. Day rates pro offshore vrty jsou na multi-year highech.',
        retail_meaning: 'Energetický sektor je cyklický. Sledujte cenu ropy, OPEC rozhodnutí a geopolitické napětí. Vysoké day rates jsou pozitivní pro offshore drilling firmy.',
      },
      biotech: {
        title: 'Biotech sektor – riziko a příležitost',
        description: `${stock.company_name} je biotechnologická firma, kde je úspěch často binární - závisí na výsledcích klinických studií a FDA schváleních.`,
        context: 'Biotech akcie jsou vysoce rizikové s potenciálem enormních výnosů. Klíčové katalyzátory jsou data z klinických studií, FDA rozhodnutí a partnerství s velkými farmaceutickými firmami. PDUFA data a data readouty jsou nejdůležitější události.',
        retail_meaning: 'U biotech akcií nikdy nesázejte vše na jednu kartu. Výsledky studií mohou být binární - akcie může vzrůst 100%+ nebo klesnout 50%+ za den. Diverzifikujte a znáte termíny katalyzátorů.',
      },
      mining: {
        title: 'Těžební sektor – komoditní závislost',
        description: `${stock.company_name} je závislá na cenách komodit a regulatorním prostředí. Těžební firmy těží z růstu poptávky po kovech pro elektromobilitu a energetický přechod.`,
        context: 'Těžební sektor prochází strukturální změnou díky poptávce po mědi, lithiu a dalších kovech potřebných pro elektrifikaci. Zároveň čelí zvýšeným regulatorním požadavkům a ESG tlakům.',
        retail_meaning: 'Těžební akcie jsou cyklické a silně korelují s cenami komodit. Sledujte ceny mědi, uhlí a dalších komodit. Malé explorační firmy jsou vysoce spekulativní.',
      },
      tech: {
        title: 'Software sektor – opakující se příjmy',
        description: `${stock.company_name} má obchodní model založený na opakujících se příjmech (SaaS/license). Constellation Software model vertikálních akvizic je unikátní strategie.`,
        context: 'Software firmy s vysokým podílem opakujících se příjmů mají typicky vyšší valuace. Constellation Software model (sériové akvizice malých softwarových firem) je uznávaný jako jeden z nejúspěšnějších v odvětví. Lumine Group jako spin-off sleduje podobnou strategii.',
        retail_meaning: 'Software firmy s opakujícími se příjmy jsou méně cyklické. U CSU/LMN sledujte akvizice a organický růst. Vysoké valuace mohou být oprávněné při konzistentním růstu.',
      },
    };

    const insight = sectorInsights[stock.sector];
    if (!insight) return null;

    return {
      ...insight,
      category: 'sector',
      sources: 'Sektorová analýza, průmyslové zprávy',
      importance: 2,
    };
  }

  _analyzeInstitutionalActivity(ticker, stock) {
    const holdings = this.db.getInstitutionsByTicker(ticker, 10);
    
    if (!holdings || holdings.length === 0) {
      return {
        title: 'Omezená institucionální data',
        description: `Pro ${stock.company_name} nejsou aktuálně k dispozici detailní data o institucionálních držbách. To může být způsobeno zpožděním v SEC filings nebo nízkou institucionální penetrací.`,
        context: 'Nízká institucionální účast může znamenat, že akcie je "pod radarem" velkých fondů. Pokud instituce začnou nakupovat, může to vytvořit významný nákupní tlak.',
        retail_meaning: 'Nízká institucionální účast = menší likvidita, ale potenciálně větší příležitost. Pokud velký fond začne budovat pozici, cena může výrazně vzrůst.',
        category: 'institutional',
        sources: 'SEC EDGAR 13F Filings',
        importance: 2,
      };
    }

    const totalBought = holdings.filter(h => h.change_shares > 0).length;
    const totalSold = holdings.filter(h => h.change_shares < 0).length;

    if (totalBought > totalSold) {
      return {
        title: `Instituce akumulují – ${totalBought} fondů nakupuje`,
        description: `U ${stock.company_name} více institucí zvyšuje své pozice (${totalBought}) než snižuje (${totalSold}). Institucionální akumulace je pozitivní signál.`,
        context: 'Institucionální investoři mají přístup k detailnějším analýzám a většímu výzkumu. Jejich nákupy často předcházejí cenovým růstům. Sledujte, které fondy nakupují a jakou mají historickou úspěšnost.',
        retail_meaning: 'Pozitivní signál! "Chytré peníze" nakupují. Zkontrolujte, kteří konkrétní fondy zvyšují pozice a jakou mají investiční strategii.',
        category: 'institutional',
        sources: 'SEC EDGAR 13F Filings',
        importance: 3,
      };
    }

    return {
      title: `Institucionální aktivita: ${totalBought} nákupů, ${totalSold} prodejů`,
      description: `Institucionální pozice u ${stock.company_name} se vyvíjejí smíšeně. Některé fondy pozice zvyšují, jiné snižují.`,
      context: 'Smíšené signály od institucí jsou běžné. Důležité je sledovat trend - zda se poměr nákupů k prodejům zlepšuje nebo zhoršuje v čase.',
      retail_meaning: 'Neutrální institucionální signál. Sledujte vývoj v příštích čtvrtletích pro jasnější trend.',
      category: 'institutional',
      sources: 'SEC EDGAR 13F Filings',
      importance: 2,
    };
  }
}

module.exports = InsightGenerator;
