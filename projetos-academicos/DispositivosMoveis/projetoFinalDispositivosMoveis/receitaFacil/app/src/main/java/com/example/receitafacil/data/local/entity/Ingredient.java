package com.example.receitafacil.data.local.entity;

import androidx.room.Entity;
import androidx.room.ForeignKey;
import androidx.room.Index;
import androidx.room.PrimaryKey;

@Entity(
        tableName = "ingredient",
        foreignKeys = @ForeignKey(
                entity = Recipe.class,
                parentColumns = "id",
                childColumns = "recipeId",
                onDelete = ForeignKey.CASCADE
        ),
        indices = {@Index("recipeId")}
)
public class Ingredient {

    @PrimaryKey(autoGenerate = true)
    public long id;

    public long recipeId;   // FK → Recipe.id

    public String name;     // “Farinha”, “Leite” …
    public double amount;   // valor numérico
    public String unit;     // “g”, “ml”, “xíc.”
}
