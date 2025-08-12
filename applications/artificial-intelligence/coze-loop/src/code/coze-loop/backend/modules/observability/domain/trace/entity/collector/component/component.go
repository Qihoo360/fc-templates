// Original Files: open-telemetry/opentelemetry-collector
// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0
// This file may have been modified by ByteDance Ltd.

package component

import (
	"context"
	"fmt"
	"strings"
)

const typeAndNameSeparator = "/"

type Type string

type ID struct {
	typeVal Type   `mapstructure:"-"`
	nameVal string `mapstructure:"-"`
}

func (id ID) String() string {
	if id.nameVal == "" {
		return string(id.typeVal)
	}
	return string(id.typeVal) + typeAndNameSeparator + id.nameVal
}

func (id ID) Type() Type {
	return id.typeVal
}

func (id *ID) UnmarshalText(text []byte) error {
	idStr := string(text)
	items := strings.SplitN(idStr, typeAndNameSeparator, 2)
	if len(items) >= 1 {
		id.typeVal = Type(strings.TrimSpace(items[0]))
	}

	if len(items) == 1 && id.typeVal == "" {
		return fmt.Errorf("id must not be empty")
	}

	if id.typeVal == "" {
		return fmt.Errorf("in %q id: the part before %s should not be empty", idStr, typeAndNameSeparator)
	}

	if len(items) > 1 {
		id.nameVal = strings.TrimSpace(items[1])
		if id.nameVal == "" {
			return fmt.Errorf("in %q id: the part after %s should not be empty", idStr, typeAndNameSeparator)
		}
	}
	return nil
}

//go:generate mockgen -destination=mocks/component.go -package=mocks . Component
type Component interface {
	Start(ctx context.Context) error
	Shutdown(ctx context.Context) error
}

type Factory interface {
	Type() Type
	CreateDefaultConfig() Config
}

type CreateDefaultConfigFunc func() Config

func (f CreateDefaultConfigFunc) CreateDefaultConfig() Config {
	return f()
}
