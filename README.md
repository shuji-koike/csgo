# build

```sh
# start dev server on http://localhost:3000/
npm start

npm build
```

```sh
go get -u
go build .

cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" ./static/wasm_exec.js
GOOS=js GOARCH=wasm go build -o ./static/main.wasm .
```

# links

- https://github.com/markus-wa/demoinfocs-golang
- https://github.com/ValveSoftware/csgo-demoinfo/tree/master/demoinfogo
- https://material-ui.com/components/buttons/
- https://material-ui.com/api/slider/

- https://csgostats.gg/
- https://www.noesis.gg/
- https://www.behance.net/gallery/87240189/ORION-CSGO-Demo-Manager

<details>
  <summary>memo</summary>

```scala
val sqlContext = new org.apache.spark.sql.SQLContext(sc)
val dem = sqlContext.jsonFile("/Volumes/Storage/replays/4901-iem-katowice-2020/*.dem.json.gz")

dem.registerTempTable("dem")
dem.printSchema()

sqlContext.sql("SELECT MapName, COUNT(*) FROM dem GROUP BY MapName").collect.foreach(println)

sqlContext.sql("""
SELECT KillEvent.Weapon, COUNT(_)
FROM (SELECT explode(KillEvents) AS KillEvent FROM dem)
GROUP BY KillEvent.Weapon
ORDER BY COUNT(_) DESC
""").collect.foreach(println)
```

```sh
go get -u github.com/pilu/fresh
```

```sh
# http://simpleradar.com/
rm *_spectate.dds
for file in *.dds; do; convert "$file" PNG8:"$(basename "$file" .dds).png"; rm "$file"; done

cd ~/Downloads/csgo/materials/panorama/images/icons/equipment

convert -density 75 -background none p2000.svg 1.png
convert -density 75 -background none glock.svg 2.png
convert -density 75 -background none p250.svg 3.png
convert -density 75 -background none deagle.svg 4.png
convert -density 75 -background none fiveseven.svg 5.png
convert -density 75 -background none elite.svg 6.png
convert -density 75 -background none tec9.svg 7.png
convert -density 75 -background none cz75a.svg 8.png
convert -density 75 -background none usp_silencer.svg 9.png
convert -density 75 -background none revolver.svg 10.png

convert -density 75 -background none mp7.svg 101.png
convert -density 75 -background none mp9.svg 102.png
convert -density 75 -background none bizon.svg 103.png
convert -density 75 -background none mac10.svg 104.png
convert -density 75 -background none ump45.svg 105.png
convert -density 75 -background none p90.svg 106.png

convert -density 75 -background none sawedoff.svg 201.png
convert -density 75 -background none nova.svg 202.png
convert -density 75 -background none mag7.svg 203.png
convert -density 75 -background none xm1014.svg 204.png
convert -density 75 -background none m249.svg 205.png
convert -density 75 -background none negev.svg 206.png

convert -density 75 -background none galilar.svg 301.png
convert -density 75 -background none famas.svg 302.png
convert -density 75 -background none ak47.svg 303.png
convert -density 75 -background none m4a1.svg 304.png
convert -density 75 -background none m4a1_silencer.svg 305.png
convert -density 75 -background none ssg08.svg 306.png
convert -density 75 -background none sg556.svg 307.png
convert -density 75 -background none aug.svg 308.png
convert -density 75 -background none awp.svg 309.png
convert -density 75 -background none scar20.svg 310.png
convert -density 75 -background none g3sg1.svg 311.png
```

- https://github.com/SteamDatabase/Protobufs/blob/master/csgo/cstrike15_gcmessages.proto

```sh
protoc --decode CDataGCCStrike15_v2_MatchInfo --proto_path ~/shuji-koike/Protobufs/csgo cstrike15_gcmessages.proto < match730_003331931056520560953_0320757822_900.dem.info
```

```json
{
  "version": 2,
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
```

```yaml
  test:
    image: "node:13"
    volumes:
      - ".:/app"
    working_dir: /app
    command: npm test
  main:
    restart: on-failure
    image: "golang:1.13"
    volumes:
      - "go-pkg-mod:/go/pkg/mod"
      - ".:/app"
      - "${APP_DEMO_DIR}:/app/var"
    ports:
      - "4000:4000"
    working_dir: /app
    environment:
      GODEBUG: "${GODEBUG}"
    command: go run github.com/pilu/fresh
volumes:
  go-pkg-mod:
    driver: local
```

</details>
