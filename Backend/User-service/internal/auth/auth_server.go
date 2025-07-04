package auth

import (
	"context"
	"fmt"
	"log"
	"os"
	"user_service/internal/handlers"

	"github.com/SafeDeal/proto/auth/v0"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
)

type AuthServer struct {
    v0.UnimplementedAuthServiceServer
    RedisClient *redis.Client
}

func (s *AuthServer) VerifyToken(ctx context.Context, req *v0.VerifyTokenRequest) (*v0.VerifyTokenResponse, error) {
    tokenString := req.GetToken()
    if tokenString == "" {
        return &v0.VerifyTokenResponse{Valid: false}, nil
    }

    token, err := jwt.ParseWithClaims(tokenString,&handlers.CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        secret := os.Getenv("JWT_SECRET_KEY")
        if secret == "" {
            return nil, fmt.Errorf("JWT_SECRET_KEY is not set")
        }
        return []byte(secret), nil
    
    })

     if err != nil {
        log.Printf("JWT Parse Error: %v", err)
        return &v0.VerifyTokenResponse{Valid: false}, nil
    }
    
     if !token.Valid {
        log.Printf("Token is not valid. Claims: %+v", token.Claims)
        return &v0.VerifyTokenResponse{Valid: false}, nil
    }

    claims, ok := token.Claims.(*handlers.CustomClaims)
    if !ok {
    log.Println("Failed to cast claims")
    return &v0.VerifyTokenResponse{Valid: false}, nil
       }
   
    sessionID := claims.ID    
    userID := claims.UserID 

   // Check Redis for revoked session
    isRevoked, _ := s.RedisClient.Get(context.Background(), "token:"+sessionID).Result()
    if isRevoked == "revoked" {
        log.Printf("Session %s was revoked", sessionID)
        return &v0.VerifyTokenResponse{Valid: false}, nil
    }

    return &v0.VerifyTokenResponse{
        Valid:     true,
        UserId:    userID,
        SessionId: sessionID,
        ExpiresAt:  claims.ExpiresAt.Unix(),
    }, nil
}
