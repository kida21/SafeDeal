package auth

import (
	"context"
	"fmt"
	
	"os"

	"github.com/SafeDeal/proto/auth/v1"
	"github.com/golang-jwt/jwt/v5"
)

type AuthServer struct {
    v1.UnimplementedAuthServiceServer
}

func (s *AuthServer) VerifyToken(ctx context.Context, req *v1.VerifyTokenRequest) (*v1.VerifyTokenResponse, error) {
    tokenString := req.GetToken()
    
    if tokenString == "" {
        return &v1.VerifyTokenResponse{Valid: false}, nil
    }

    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method")
        }
        return []byte(os.Getenv("JWT_SECRET_KEY")), nil
    })

    if err != nil || !token.Valid {
        return &v1.VerifyTokenResponse{Valid: false}, nil
    }

    claims, ok := token.Claims.(jwt.MapClaims)
    if !ok {
        return &v1.VerifyTokenResponse{Valid: false}, nil
    }

    userIDFloat, ok := claims["user_id"].(float64)
    if !ok {
        return &v1.VerifyTokenResponse{Valid: false}, nil
    }
    sessionID, ok := claims["jti"].(string)
    if !ok {
        return &v1.VerifyTokenResponse{Valid: false}, nil
    }
    return &v1.VerifyTokenResponse{
        Valid:     true,
        UserId:    uint32(userIDFloat),
        SessionId: sessionID,
        ExpiresAt: int64(claims["exp"].(float64)),
    }, nil
}