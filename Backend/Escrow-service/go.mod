module escrow_service

go 1.23.8

toolchain go1.23.11

require (
	github.com/SafeDeal/proto/auth v0.0.0-00010101000000-000000000000
	github.com/SafeDeal/proto/escrow v0.0.0-00010101000000-000000000000
	github.com/hashicorp/consul/api v1.32.1
	gorm.io/gorm v1.30.0
	message_broker v0.0.0-00010101000000-000000000000

)

replace github.com/SafeDeal/proto/auth => ../../Proto/auth

replace github.com/SafeDeal/proto/escrow => ../../Proto/escrow

replace message_broker => ../../message-broker

require (
	github.com/armon/go-metrics v0.4.1 // indirect
	github.com/fatih/color v1.16.0 // indirect
	github.com/hashicorp/errwrap v1.1.0 // indirect
	github.com/hashicorp/go-cleanhttp v0.5.2 // indirect
	github.com/hashicorp/go-hclog v1.5.0 // indirect
	github.com/hashicorp/go-immutable-radix v1.3.1 // indirect
	github.com/hashicorp/go-multierror v1.1.1 // indirect
	github.com/hashicorp/go-rootcerts v1.0.2 // indirect
	github.com/hashicorp/golang-lru v0.5.4 // indirect
	github.com/hashicorp/serf v0.10.1 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/pgx/v5 v5.6.0 // indirect
	github.com/jackc/puddle/v2 v2.2.2 // indirect
	github.com/mitchellh/go-homedir v1.1.0 // indirect
	github.com/mitchellh/mapstructure v1.5.0 // indirect
	golang.org/x/exp v0.0.0-20250305212735-054e65f0b394 // indirect
	golang.org/x/sync v0.15.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20250603155806-513f23925822 // indirect
	google.golang.org/protobuf v1.36.6 // indirect

)

require (
	github.com/andybalholm/brotli v1.2.0 // indirect
	github.com/fxamacker/cbor/v2 v2.8.0 // indirect
	github.com/gofiber/fiber/v3 v3.0.0-beta.4
	github.com/gofiber/schema v1.5.0 // indirect
	github.com/gofiber/utils/v2 v2.0.0-beta.9 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	github.com/klauspost/compress v1.18.0 // indirect
	github.com/mattn/go-colorable v0.1.14 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/philhofer/fwd v1.1.3-0.20240916144458-20a13a1f6b7c // indirect
	github.com/streadway/amqp v1.1.0
	github.com/tinylib/msgp v1.3.0 // indirect
	github.com/valyala/bytebufferpool v1.0.0 // indirect
	github.com/valyala/fasthttp v1.62.0 // indirect
	github.com/x448/float16 v0.8.4 // indirect
	golang.org/x/crypto v0.39.0 // indirect
	golang.org/x/net v0.41.0 // indirect
	golang.org/x/sys v0.33.0 // indirect
	golang.org/x/text v0.26.0 // indirect
	google.golang.org/grpc v1.73.0
	gorm.io/driver/postgres v1.6.0
)
