package com.example.receitafacil.data.local.entity;

import androidx.room.Entity;
import androidx.room.ForeignKey;
import androidx.room.Index;
import androidx.room.PrimaryKey;

@Entity(
        tableName = "step",
        foreignKeys = @ForeignKey(
                entity = Recipe.class,
                parentColumns = "id",
                childColumns = "recipeId",
                onDelete = ForeignKey.CASCADE
        ),
        indices = {@Index("recipeId")}
)
public class Step {

    @PrimaryKey(autoGenerate = true)
    public long id;

    public long recipeId;      // FK → Recipe.id
    public int order;          // posição 1, 2, 3…
    public String instruction; // texto do passo
    public int timerSec;       // 0 = sem temporizador
}

