package auth

import (
	"context"
	"errors"

	"fmt"
	"log"
	"os"
	"user_service/internal/handlers"
	"user_service/internal/model"

	v0 "github.com/SafeDeal/proto/auth/v0"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/wrapperspb"

	"gorm.io/gorm"
)

type AuthServer struct {
    v0.UnimplementedAuthServiceServer
    RedisClient *redis.Client
    DB *gorm.DB
}

func (s *AuthServer) VerifyToken(ctx context.Context, req *v0.VerifyTokenRequest) (*v0.VerifyTokenResponse, error) {
    tokenString := req.GetToken()
    if tokenString == "" {
        return &v0.VerifyTokenResponse{Valid: false}, nil
    }

    token, err := jwt.ParseWithClaims(tokenString, &handlers.CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
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

    
    isRevoked, err := s.RedisClient.Get(ctx, "token:"+sessionID).Result()
    if err == nil && isRevoked == "revoked" {
        //log.Printf("Token with session ID %s is revoked", sessionID)
        return &v0.VerifyTokenResponse{Valid: false}, nil
    }

    return &v0.VerifyTokenResponse{
        Valid:     true,
        UserId:    userID,
        SessionId: sessionID,
        ExpiresAt: claims.ExpiresAt.Unix(),
    }, nil
}

func (s *AuthServer) GetUser(ctx context.Context, req *v0.GetUserRequest) (*v0.GetUserResponse, error) {
    var user model.User
    if err := s.DB.First(&user, req.UserId).Error; err != nil {
        return &v0.GetUserResponse{
            Success: false,
            Error:   "User not found",
        }, nil
    }
    var walletPb, accountNamePb, accountNumberPb *wrapperspb.StringValue
    var bankCodePb *wrapperspb.Int32Value

    if user.WalletAddress != nil {
	      walletPb = wrapperspb.String(*user.WalletAddress)
        }
    if user.AccountName != nil && *user.AccountName != "" {
		accountNamePb = wrapperspb.String(*user.AccountName)
	}
	if user.AccountNumber != nil && *user.AccountNumber != "" {
		accountNumberPb = wrapperspb.String(*user.AccountNumber)
	}
	if user.BankCode != nil && *user.BankCode != 0 {
		bankCodePb = wrapperspb.Int32(int32(*user.BankCode))
	}
    return &v0.GetUserResponse{
        Success: true,
        User: &v0.User{
            Id:         uint32(user.ID),
            FirstName:  user.FirstName,
            LastName:   user.LastName,
            Email:      user.Email,
            Activated:  user.Activated,
            Version:    int32(user.Version),
            WalletAddress: walletPb,
            AccountName: accountNamePb,
            AccountNumber: accountNumberPb,
            BankCode: bankCodePb,
            
        },
    }, nil
}

func (s *AuthServer) CheckWalletAddress(ctx context.Context, req *v0.CheckWalletAddressRequest) (*v0.CheckWalletAddressResponse, error) {
	var user model.User
	err := s.DB.Where("wallet_address = ?", &req.WalletAddress).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &v0.CheckWalletAddressResponse{Exists: false}, nil
		}
		return nil, status.Errorf(codes.Internal, "Database error")
	}
	return &v0.CheckWalletAddressResponse{Exists: true}, nil
}

func (s *AuthServer) UpdateUser(ctx context.Context, req *v0.UpdateUserRequest) (*v0.UpdateUserResponse, error) {
	var user model.User
	if err := s.DB.First(&user, req.UserId).Error; err != nil {
		return &v0.UpdateUserResponse{
			Success: false,
			Error:   "User not found",
		}, nil
	}

	
	if user.WalletAddress != nil {
		return &v0.UpdateUserResponse{
			Success: false,
			Error:   "Wallet already exists",
		}, nil
	}

	
	user.WalletAddress = &req.WalletAddress
	user.EncryptedPrivateKey = &req.EncryptedPrivateKey

	if err := s.DB.Save(&user).Error; err != nil {
		return &v0.UpdateUserResponse{
			Success: false,
			Error:   "Failed to save wallet",
		}, nil
	}

	return &v0.UpdateUserResponse{
		Success: true,
	}, nil
}