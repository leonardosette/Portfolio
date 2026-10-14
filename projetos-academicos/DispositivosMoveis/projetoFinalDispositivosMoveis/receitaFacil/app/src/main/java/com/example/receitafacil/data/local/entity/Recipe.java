package com.example.receitafacil.data.local.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.Index;
import androidx.room.PrimaryKey;

@Entity(
        tableName = "recipe",
        indices = {@Index(value = {"name"}, unique = false)}
)
public class Recipe {

    @PrimaryKey(autoGenerate = true)
    public long id;

    @NonNull
    public String name;

    public String description;      // resumo opcional
    public String photoUri;         // URI da foto (storage interno)
    public String category;         // ex.: “Sobremesa”, “Massas”
    public long createdAt;          // epoch ms – permite ordenar por data
}

