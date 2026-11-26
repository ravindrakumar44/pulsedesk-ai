using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HelpdeskSentiment.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAgentAssignmentAndResolution : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AssignedAgentId",
                table: "Complaints",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Priority",
                table: "Complaints",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Medium")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ResolutionMessage",
                table: "Complaints",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "ResolvedAt",
                table: "Complaints",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Complaints_AssignedAgentId",
                table: "Complaints",
                column: "AssignedAgentId");

            migrationBuilder.CreateIndex(
                name: "IX_Complaints_Priority",
                table: "Complaints",
                column: "Priority");

            migrationBuilder.AddForeignKey(
                name: "FK_Complaints_Users_AssignedAgentId",
                table: "Complaints",
                column: "AssignedAgentId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Complaints_Users_AssignedAgentId",
                table: "Complaints");

            migrationBuilder.DropIndex(
                name: "IX_Complaints_AssignedAgentId",
                table: "Complaints");

            migrationBuilder.DropIndex(
                name: "IX_Complaints_Priority",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "AssignedAgentId",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "ResolutionMessage",
                table: "Complaints");

            migrationBuilder.DropColumn(
                name: "ResolvedAt",
                table: "Complaints");
        }
    }
}
